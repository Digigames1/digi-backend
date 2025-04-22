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
    mongoUrl: process.env.DB_URL, // 🔁 тут замість MONGO_URL
    dbName: "digi",
    collectionName: "sessions"
  }),
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 2 // 2 години
  }
}));

app.use(morgan("dev"));

app.use(session({
  secret: "yourSuperSecretKey",
  resave: false,
  saveUninitialized: true
}));

// 🔽 Статичні файли
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
  res.status(200).json({ success: true });
});

// 📦 Отримати корзину
app.get("/get-cart", (req, res) => {
  res.json(req.session.cart || []);
});

// 💳 Перейти до оплати
app.post("/checkout", (req, res) => {
  res.redirect("https://www.dundle.com/cart/");
});

// 🔽 Роутери
const orderRouter = require("./routers/order");
const adminRouter = require("./routers/admin");
const productsRouter = require("./routers/products");
const bambooRouter = require("./routers/bamboo");
const productPageRouter = require("./routers/productPage"); // 🆕

const client = new MongoClient(process.env.DB_URL);
let db;

async function startServer() {
  try {
    await client.connect();
    db = client.db("digi");
    console.log("✅ Connected to MongoDB");

    // 🔽 API
    app.use("/api/order", (req, res, next) => { req.db = db; next(); }, orderRouter);
    app.use("/api/admin", (req, res, next) => { req.db = db; next(); }, adminRouter);
    app.use("/api/products", productsRouter);
    app.use("/api/bamboo", bambooRouter);
    app.use("/", productPageRouter); // 🧭 API для динамічних категорій і підкатегорій

    // 🏠 Головна сторінка
    app.get("/", (req, res) => {
      res.sendFile(path.join(__dirname, "public", "index.html"));
    });

    // 🧭 Фронт (HTML) — динамічні сторінки
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




