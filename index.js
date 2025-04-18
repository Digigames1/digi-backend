const express = require("express");
const { MongoClient } = require("mongodb");
const morgan = require("morgan");
const path = require("path");
require("dotenv").config();

const app = express();

app.use(express.json());
app.use(morgan("dev"));

// 🔽 Статичні файли
app.use(express.static(path.join(__dirname, "public")));

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



