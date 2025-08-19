const express = require("express");
const { MongoClient } = require("mongodb");
const morgan = require("morgan");
const path = require("path");
require("dotenv").config();

const app = express();

app.use(express.json());
const session = require("express-session");
const MongoStore = require("connect-mongo");

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.DB_URL,
    dbName: "digi",
    collectionName: "sessions"
  }),
  cookie: {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 2
  }
}));

app.use(morgan("dev"));
app.use(express.static(path.join(__dirname, "public")));

// 🛒 Додати товар до корзини
const CART_TIMEOUT_MINUTES = 30;
app.post("/add-to-cart", (req, res) => {
  const product = req.body.product || req.body;

  product.price = Number(product.price) || 0;
  product.currencyCode = product.currencyCode || "USD";

  if (!product || !product.id || product.price === 0 || !product.currencyCode) {
    return res.status(400).json({ error: "Invalid product format" });
  }

  if (!product.addedAt) {
    product.addedAt = Date.now();
  }

  product._id = product._id || `${product.id}-${Date.now()}`;

  if (!req.session.cart) {
    req.session.cart = [];
    req.session.cartCreatedAt = Date.now();
  }

  const now = Date.now();
  if (now - (req.session.cartCreatedAt || 0) > CART_TIMEOUT_MINUTES * 60 * 1000) {
    req.session.cart = [];
    req.session.cartCreatedAt = now;
  }

  req.session.cart.push(product);
  console.log("🛒 Додано в корзину:", product);
  req.session.save(() => {
    res.status(200).json({ success: true });
  });
});

// 📦 Отримати корзину
function getCartItems(session) {
  const now = Date.now();
  const maxAge = 1000 * 60 * 60; // 1 година
  const allItems = session.cart || [];
  return allItems.filter(item => now - (item.addedAt || 0) < maxAge);
}

app.get("/api/cart", (req, res) => {
  res.json({ items: getCartItems(req.session) });
});

app.get("/get-cart", (req, res) => {
  res.json(getCartItems(req.session));
});

// ❌ Видалити товар з кошика
app.post("/remove-from-cart", (req, res) => {
  const id = req.query.id || req.body.productId || req.body.id;
  if (!req.session.cart) {
    return res.json({ success: true });
  }

  req.session.cart = req.session.cart.filter(p => p._id !== id && p.id !== id);
  req.session.save(() => {
    res.json({ success: true });
  });
});

// 🧹 Очистити кошик
app.post("/clear-cart", (req, res) => {
  req.session.cart = [];
  req.session.cartCreatedAt = Date.now();
  req.session.save(err => {
    if (err) {
      console.error("❌ Помилка збереження сесії:", err);
      return res.status(500).json({ error: "Session save failed" });
    }
    res.json({ success: true });
  });
});

// 💳 Перейти до оплати
app.post("/checkout", (req, res) => {
  res.redirect("/checkout.html");
});

// 🔽 Роутери
const orderRouter = require("./routers/order");
const adminRouter = require("./routers/admin");
const productsRouter = require("./routers/products");
const bambooRouter = require("./routers/bamboo");
const productPageRouter = require("./routers/productPage");
const popularRouter = require("./routers/popular");

const client = new MongoClient(process.env.DB_URL);
let db;

async function startServer() {
  try {
    await client.connect();
    db = client.db("digi");
    console.log("✅ Connected to MongoDB");

    app.use("/api/order", (req, res, next) => { req.db = db; next(); }, orderRouter);
    app.use("/api/admin", (req, res, next) => { req.db = db; next(); }, adminRouter);
    app.use("/api/products", productsRouter);
    app.use("/api/bamboo", bambooRouter);
    app.use("/api/popular-products", (req, res, next) => { req.db = db; next(); }, popularRouter);
    app.use("/", productPageRouter);

    app.get("/", (req, res) => {
      res.sendFile(path.join(__dirname, "public", "index.html"));
    });

    app.get("/:brand/:region?", (req, res) => {
      res.sendFile(path.join(__dirname, "public", "product.html"));
    });

    const PORT = process.env.PORT || 10000;
    app.listen(PORT, () => {
      console.log(`✅ Server is live on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
  }
}

startServer();
