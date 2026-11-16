/**
 * /api/payments — plans, checkout via VNPay, IPN callback and browser return.
 */

const express = require('express');
const v = require('../core/validate');
const env = require('../core/env');
const { protect } = require('../core/auth');
const { limits } = require('../core/security');
const { asyncHandler } = require('../core/errors');
const vnpay = require('../services/vnpay');
const { PLANS, TIERS } = require('../domain/catalog');
const { Order } = require('../entities');

const router = express.Router();

router.get('/plans', (req, res) => {
  res.json({
    success: true,
    enabled: env.vnpay.enabled,
    plans: PLANS.map((p) => ({ id: p.id, name: p.name, tier: p.tier, tierName: TIERS[p.tier].name, price: p.price, days: p.days, tagline: p.tagline, features: p.features })),
  });
});

router.post(
  '/checkout',
  protect,
  limits.write,
  asyncHandler(async (req, res) => {
    const planId = v.oneOf(req.body.planId, 'Gói', PLANS.map((p) => p.id));
    const { order, paymentUrl } = await vnpay.createOrder(req.user, planId, req.ip);
    res.status(201).json({ success: true, order: vnpay.orderView(order), paymentUrl });
  })
);

router.get(
  '/orders',
  protect,
  asyncHandler(async (req, res) => {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(30).lean();
    res.json({ success: true, items: orders.map(vnpay.orderView) });
  })
);

/** Server-to-server notification from VNPay. This is the authoritative confirmation. */
router.get(
  '/vnpay/ipn',
  asyncHandler(async (req, res) => {
    const { code } = await vnpay.settle(req.query);
    const messages = { '00': 'Confirm Success', '01': 'Order not found', '02': 'Order already confirmed', '04': 'Invalid amount', '97': 'Invalid signature' };
    res.json({ RspCode: code, Message: messages[code] || 'Unknown error' });
  })
);

/**
 * The learner's browser comes back here. The same signed parameters are verified and settled
 * (idempotent), then the browser is sent to the frontend with only a status flag.
 */
router.get(
  '/vnpay/return',
  asyncHandler(async (req, res) => {
    const { code, order } = await vnpay.settle(req.query);
    let status = 'failed';
    if (order && order.status === 'paid') status = 'success';
    else if (code === '97') status = 'invalid';
    res.redirect(302, `${env.frontendUrl}/upgrade/result?status=${status}`);
  })
);

module.exports = router;
