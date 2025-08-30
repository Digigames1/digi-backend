import nodemailer from "nodemailer";

const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

export async function sendCodesEmail({ to, orderId, codes }) {
  const html = `
    <p>Дякуємо за покупку! Ваше замовлення <b>#${orderId}</b></p>
    <p>Коди:</p>
    <ul>${codes.map(c=>`<li>${c.brand || ""}: <b>${c.code}</b>${c.pin?` (PIN: ${c.pin})`:""}</li>`).join("")}</ul>
  `;
  await transport.sendMail({
    from: process.env.EMAIL_FROM || "noreply@example.com",
    to, subject: `Ваші коди — замовлення #${orderId}`, html,
  });
}
