/**
 * Transactional email (SMTP via nodemailer).
 * Without SMTP settings nothing is sent; in local development the message is printed to the
 * server console so flows such as password reset can still be exercised.
 */

const nodemailer = require('nodemailer');
const env = require('../core/env');

let transporter = null;
/** Messages captured during automated tests. */
const outbox = [];

const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.mail.host,
      port: env.mail.port,
      secure: env.mail.port === 465,
      auth: { user: env.mail.user, pass: env.mail.pass },
    });
  }
  return transporter;
}

async function send({ to, subject, text, html }) {
  if (env.isTest) {
    outbox.push({ to, subject, text, html });
    return { sent: true };
  }
  if (!env.mail.enabled) {
    if (!env.isProduction) console.log(`[mail] SMTP chưa cấu hình — nội dung email gửi tới ${to}:\n${subject}\n${text}`);
    else console.warn('[mail] SMTP is not configured; email was not sent.');
    return { sent: false };
  }
  try {
    await getTransporter().sendMail({ from: env.mail.from, to, subject, text, html });
    return { sent: true };
  } catch (err) {
    console.error('[mail] send failed:', err.message);
    return { sent: false };
  }
}

function sendPasswordReset(user, token) {
  // The link always points at the configured frontend, never at a host taken from the request.
  const link = `${env.frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;
  const name = user.name || user.fullName || 'bạn';
  return send({
    to: user.email,
    subject: 'Đặt lại mật khẩu QuizMe',
    text: `Chào ${name},\n\nBạn (hoặc ai đó) vừa yêu cầu đặt lại mật khẩu QuizMe. Mở liên kết sau trong vòng 15 phút để đặt mật khẩu mới:\n${link}\n\nNếu bạn không yêu cầu, hãy bỏ qua email này — mật khẩu của bạn không thay đổi.`,
    html: `<p>Chào ${escapeHtml(name)},</p><p>Bạn (hoặc ai đó) vừa yêu cầu đặt lại mật khẩu QuizMe. Liên kết có hiệu lực trong <b>15 phút</b>:</p><p><a href="${escapeHtml(link)}">Đặt lại mật khẩu</a></p><p>Nếu bạn không yêu cầu, hãy bỏ qua email này — mật khẩu của bạn không thay đổi.</p>`,
  });
}

module.exports = { send, sendPasswordReset, outbox };
