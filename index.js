const express = require("express");
const { MongoClient } = require("mongodb");
const morgan = require("morgan");
const path = require("path");
require("dotenv").config();

const app = express();

app.use(express.json());
app.use(morgan("dev"));

// 🔽 Статичні файли (для admin.html та інші)
app.use(express.static(path.join(__dirname, "public")));

// 🔽 Роутери
const orderRouter = require("./routers/order");
const adminRouter = require("./routers/admin");
const productsRouter = require("./routers/products");
const bambooRouter = require("./routers/bamboo");
const productPageRouter = require("./routers/productPage"); // 🆕 Динамічний роут

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

    // Адмін запити
    app.use("/api/admin", (req, res, next) => {
      req.db = db;
      next();
    }, adminRouter);

    // 🔽 Продукти з Giftery
    app.use("/api/products", productsRouter);

    // 🔽 Каталог з Bamboo
    app.use("/api/bamboo", bambooRouter);

    // 🧭 API динамічних сторінок (Playstation / Steam / тощо)
    app.use("/", productPageRouter); // 🆕

    // 🧭 Фронт динамічних сторінок (наприклад /steam або /steam/usa)
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

