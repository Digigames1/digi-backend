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
app.post("/add-to-cart", (req, res) => {
  const { product } = req.body;

  if (!product || !product.id || !product.name || !product.price) {
    return res.status(400).json({ error: "Invalid product format" });
  }

  if (!req.session.cart) {
    req.session.cart = [];
  }

  req.session.cart.push(product);
  console.log("🛒 Додано в корзину:", product);
  req.session.save(() => {
    res.status(200).json({ success: true });
  });
});

// ❌ Видалити товар з корзини
app.post("/remove-from-cart", (req, res) => {
  const { productId } = req.body;

  if (!productId) {
    return res.status(400).json({ error: "Product ID is required" });
  }

  if (!req.session.cart) {
    req.session.cart = [];
  }

  req.session.cart = req.session.cart.filter(
    item => item.id !== productId && item._id !== productId
  );

  req.session.save(err => {
    if (err) {
      console.error("❌ Помилка збереження сесії:", err);
      return res.status(500).json({ error: "Session save failed" });
    }
    res.json({ success: true });
  });
});

// 📦 Отримати корзину
app.get("/get-cart", (req, res) => {
  res.json(req.session.cart || []);
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
