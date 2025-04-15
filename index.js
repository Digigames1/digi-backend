const express = require("express");
const { MongoClient } = require("mongodb");
const morgan = require("morgan");
require("dotenv").config();

const app = express();

app.use(express.json());
app.use(morgan("dev"));

const orderRouter = require("./routers/order");
const adminRouter = require("./routers/admin");

const client = new MongoClient(process.env.DB_URL);
let db;

async function startServer() {
  try {
    await client.connect();
    db = client.db("digi"); // назва бази (залиш digi)

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

    const PORT = process.env.PORT || 10000;
    app.listen(PORT, () => {
      console.log(`✅ Server is live on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
  }
}

startServer();
