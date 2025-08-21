const express = require("express");
const crypto = require("crypto");
const base64 = require("base-64");
const nodemailer = require("nodemailer");

const router = express.Router();

// Валідація email
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const {
  LIQPAY_PUBLIC_KEY,
  LIQPAY_PRIVATE_KEY,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  BASE_URL
} = process.env;

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT) || 465,
  secure: true,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS
  }
});

function generateLiqPaySignature(data) {
  return crypto
    .createHash("sha1")
    .update(LIQPAY_PRIVATE_KEY + data + LIQPAY_PRIVATE_KEY)
    .digest("base64");
}

function createLiqPayData(params) {
  const data = base64.encode(JSON.stringify(params));
  const signature = generateLiqPaySignature(data);
  return { data, signature };
}

function generateCode() {
  return crypto.randomBytes(8).toString("hex").toUpperCase();
}

async function sendCodeEmail(to, code) {
  await transporter.sendMail({
    from: SMTP_USER,
    to,
    subject: "Your purchase code",
    text: `Thank you for your purchase. Your code: ${code}`
  });
}

router.post("/", async (req, res) => {
  const { productId, email, quantity, name, price } = req.body;

  // Перевірка
  if (!productId || !email || !quantity || !name || !price) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({ error: "Invalid email format." });
  }

  const orderId = crypto.randomUUID();
  const order = {
    productId,
    email,
    name,
    quantity,
    price: parseFloat(price),
    status: "pending",
    createdAt: new Date(),
    orderId
  };

  try {
    await req.db.collection("orders").insertOne(order);

    const serverUrl =
      BASE_URL || `${req.protocol}://${req.get("host")}`;

    const params = {
      public_key: LIQPAY_PUBLIC_KEY,
      version: "3",
      action: "pay",
      amount: order.price,
      currency: "USD",
      description: `Purchase ${name}`,
      order_id: orderId,
      server_url: `${serverUrl}/api/order/liqpay-callback`,
      result_url: `${serverUrl}/order-success.html`
    };

    const liqpay = createLiqPayData(params);

    res
      .status(201)
      .json({ message: "Order saved!", orderId, liqpay });
  } catch (err) {
    console.error("❌ Order error:", err);
    res.status(500).json({ error: "Order processing failed." });
  }
});

router.post("/liqpay-callback", async (req, res) => {
  const { data, signature } = req.body;

  try {
    const expected = generateLiqPaySignature(data);
    if (signature !== expected) {
      return res.status(400).json({ error: "Invalid signature" });
    }

    const payment = JSON.parse(base64.decode(data));

    if (payment.status === "success" || payment.status === "sandbox") {
      const order = await req.db
        .collection("orders")
        .findOne({ orderId: payment.order_id });

      if (order && order.status !== "paid") {
        const code = generateCode();
        await sendCodeEmail(order.email, code);
        await req.db
          .collection("orders")
          .updateOne(
            { orderId: order.orderId },
            { $set: { status: "paid", code, paymentInfo: payment } }
          );
      }
    }

    res.json({ status: "ok" });
  } catch (err) {
    console.error("❌ LiqPay callback error:", err);
    res.status(500).json({ error: "Callback processing failed." });
  }
});

// GET: Отримати всі замовлення
router.get("/", async (req, res) => {
  try {
    const orders = await req.db.collection("orders").find().toArray();
    res.status(200).json(orders);
  } catch (err) {
    console.error("❌ Failed to fetch orders:", err);
    res.status(500).json({ error: "Failed to fetch orders." });
  }
});

// ✅ GET: Адмін-доступ (тільки з токеном)
router.get("/admin", async (req, res) => {
  const token = req.query.token;

  if (token !== process.env.ADMIN_TOKEN) {
    return res.status(403).json({ error: "Unauthorized access." });
  }

  try {
    const orders = await req.db.collection("orders").find().toArray();
    res.status(200).json(orders);
  } catch (err) {
    console.error("❌ Admin fetch error:", err);
    res.status(500).json({ error: "Failed to fetch orders." });
  }
});

module.exports = router;

