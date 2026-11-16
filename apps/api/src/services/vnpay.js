/**
 * VNPay payment gateway (API v2.1.0, HMAC-SHA512).
 *
 * An order is only ever marked paid from parameters whose signature verifies with our secret, whose
 * amount matches the stored order, and the pending → paid transition is atomic — replaying a
 * callback or forging a "success" return URL grants nothing.
 */

const crypto = require('crypto');
const env = require('../core/env');
const User = require('../entities/User');
const { Order } = require('../entities');
const { PLAN_BY_ID, TIERS } = require('../domain/catalog');
const time = require('../core/time');
const game = require('./gamification');
const { notFound, unavailable } = require('../core/errors');

const PAYMENT_WINDOW_MINUTES = 15;

/** VNPay encodes values like application/x-www-form-urlencoded (spaces as '+'). */
const encode = (value) => encodeURIComponent(String(value)).replace(/%20/g, '+');

/** Canonical, key-sorted query string that is both signed and sent. */
function canonicalQuery(params) {
  return Object.keys(params)
    .filter((k) => params[k] !== undefined && params[k] !== null && params[k] !== '')
    .sort()
    .map((k) => `${encode(k)}=${encode(params[k])}`)
    .join('&');
}

const sign = (data, secret = env.vnpay.hashSecret) => crypto.createHmac('sha512', secret).update(Buffer.from(data, 'utf-8')).digest('hex');

/** yyyyMMddHHmmss in Vietnam time, as VNPay expects. */
function vnpDate(date) {
  return new Date(date.getTime() + 7 * 3600 * 1000).toISOString().replace(/[-:T]/g, '').slice(0, 14);
}

function buildPaymentUrl(order, clientIp, now = new Date()) {
  const params = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: env.vnpay.tmnCode,
    vnp_Amount: order.amount * 100,
    vnp_CurrCode: 'VND',
    vnp_TxnRef: order.txnRef,
    vnp_OrderInfo: `Thanh toan goi QuizMe ${order.planId}`,
    vnp_OrderType: 'other',
    vnp_Locale: 'vn',
    vnp_ReturnUrl: `${env.apiUrl}/api/payments/vnpay/return`,
    vnp_IpAddr: clientIp || '127.0.0.1',
    vnp_CreateDate: vnpDate(now),
    vnp_ExpireDate: vnpDate(order.expiresAt),
  };
  const query = canonicalQuery(params);
  return `${env.vnpay.url}?${query}&vnp_SecureHash=${sign(query)}`;
}

/** True when the vnp_* parameters carry a valid signature. Constant-time comparison. */
function verifySignature(query) {
  const received = typeof query.vnp_SecureHash === 'string' ? query.vnp_SecureHash.toLowerCase() : '';
  const params = {};
  Object.keys(query).forEach((k) => {
    if (k.startsWith('vnp_') && k !== 'vnp_SecureHash' && k !== 'vnp_SecureHashType' && typeof query[k] === 'string') params[k] = query[k];
  });
  const expected = sign(canonicalQuery(params));
  if (received.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected));
}

async function createOrder(user, planId, clientIp) {
  if (!env.vnpay.enabled) throw unavailable('Cổng thanh toán chưa được cấu hình. Vui lòng liên hệ hỗ trợ để nâng cấp.');
  const plan = PLAN_BY_ID.get(planId);
  if (!plan) throw notFound('Gói không tồn tại');
  const now = new Date();
  const order = await Order.create({
    user: user._id,
    planId: plan.id,
    tier: plan.tier,
    days: plan.days,
    amount: plan.price,
    txnRef: `QM${now.getTime()}${crypto.randomBytes(4).toString('hex')}`,
    expiresAt: new Date(now.getTime() + PAYMENT_WINDOW_MINUTES * 60000),
  });
  return { order, paymentUrl: buildPaymentUrl(order, clientIp, now) };
}

/** Give the user the purchased tier; time is added on top of an active plan of the same tier. */
async function activatePlan(userId, tier, days, now = new Date()) {
  const user = await User.findById(userId);
  if (!user) return null;
  const current = user.plan || {};
  const active = current.expiresAt && current.expiresAt > now;
  const currentRank = active ? TIERS[current.tier]?.rank ?? 0 : 0;
  const newRank = TIERS[tier].rank;
  let base = now;
  let finalTier = tier;
  if (active && currentRank === newRank) base = current.expiresAt; // extend
  else if (active && currentRank > newRank) {
    // Keep the higher tier and extend it rather than downgrading a paying user.
    base = current.expiresAt;
    finalTier = current.tier;
  }
  user.plan = { tier: finalTier, expiresAt: time.addDays(base, days) };
  await user.save();
  return user;
}

/**
 * Apply a signed VNPay result to its order. Idempotent.
 * @returns {{code:string, order?:object}} code follows VNPay's IPN response codes
 */
async function settle(query) {
  if (!env.vnpay.enabled || !verifySignature(query)) return { code: '97' }; // invalid signature
  const order = await Order.findOne({ txnRef: query.vnp_TxnRef });
  if (!order) return { code: '01' }; // order not found
  if (Number(query.vnp_Amount) !== order.amount * 100) return { code: '04', order }; // amount mismatch
  if (order.status !== 'pending') return { code: '02', order }; // already processed

  const success = query.vnp_ResponseCode === '00' && (query.vnp_TransactionStatus === undefined || query.vnp_TransactionStatus === '00');
  const updated = await Order.findOneAndUpdate(
    { _id: order._id, status: 'pending' },
    {
      $set: {
        status: success ? 'paid' : 'failed',
        providerTxnNo: String(query.vnp_TransactionNo || '').slice(0, 40) || null,
        providerCode: String(query.vnp_ResponseCode || '').slice(0, 8),
        paidAt: success ? new Date() : null,
      },
    },
    { new: true }
  );
  if (!updated) return { code: '02', order };

  if (success) {
    await activatePlan(updated.user, updated.tier, updated.days);
    const plan = PLAN_BY_ID.get(updated.planId);
    await game.notify(updated.user, 'payment', 'Thanh toán thành công', `Gói ${plan ? plan.name : updated.planId} đã được kích hoạt. Cảm ơn bạn!`, '/upgrade');
  }
  return { code: '00', order: updated };
}

const orderView = (o) => ({
  id: String(o._id),
  planId: o.planId,
  planName: PLAN_BY_ID.get(o.planId)?.name || o.planId,
  amount: o.amount,
  status: o.status,
  paidAt: o.paidAt,
  createdAt: o.createdAt,
});

module.exports = { createOrder, settle, verifySignature, buildPaymentUrl, canonicalQuery, sign, activatePlan, orderView, vnpDate };
