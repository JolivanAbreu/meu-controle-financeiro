const nodemailer = require('nodemailer');

function isConfigured() {
  return !!(process.env.MAIL_HOST && process.env.MAIL_USER && process.env.MAIL_PASS);
}

function createTransporter() {
  if (!isConfigured()) return null;
  const port = Number(process.env.MAIL_PORT) || 465;
  return nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });
}

async function sendMail({ to, subject, html }) {
  const transporter = createTransporter();
  if (!transporter) {
    console.warn(`MAIL_* não configurado — e-mail para ${to} não enviado: "${subject}"`);
    return { sent: false };
  }
  await transporter.sendMail({
    from: `"Meu Controle Financeiro" <${process.env.MAIL_USER}>`,
    to,
    subject,
    html,
  });
  return { sent: true };
}

async function verifyConnection() {
  const transporter = createTransporter();
  if (!transporter) {
    return { ok: false, reason: 'MAIL_HOST, MAIL_USER ou MAIL_PASS ausente no .env' };
  }
  await transporter.verify();
  return { ok: true };
}

module.exports = { isConfigured, sendMail, verifyConnection };