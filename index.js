const express = require("express");
const { MongoClient } = require("mongodb");
const morgan = require("morgan");
const path = require("path");
require("dotenv").config();

const app = express();

app.use(express.json());
app.use(morgan("dev"));

// 🔽 Статичні файли (для admin.html та інших)
app.use(express.static(path.join(__dirname, "public")));

// 🔽 Роутери
const orderRouter = require("./routers/order");
const adminRouter = require("./routers/admin");
const productsRouter = require("./routers/products");
const bambooRouter = require("./routers/bamboo");
const dynamicProductRouter = require("./routers/dynamicProduct"); // ✅ Новий роут

const client = new MongoClient(process.env.DB_URL);
let db;

async function startServer() {
  try {
    await client.connect();
    db = client.db("digi");
    console.log("✅ Connected to MongoDB");

    // Публічні запити
    app.use("/api/order", (req, res, next) => {
      req.db = db;
      next();
    }, orderRouter);

    // Адмін
    app.use("/api/admin", (req, res, next) => {
      req.db = db;
      next();
    }, adminRouter);

    // Giftery API
    app.use("/api/products", productsRouter);

    // Bamboo API
    app.use("/api/bamboo", bambooRouter);

    // 🧭 Динамічний каталог за брендом (Playstation, Steam, тощо)
    app.use("/", dynamicProductRouter);

    // 🧭 Фронтовий шаблон для сторінки товару
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


