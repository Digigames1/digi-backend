const express = require("express");
const { MongoClient } = require("mongodb");
const morgan = require("morgan"); // 👈 додано morgan
require("dotenv").config();

const app = express();

app.use(express.json());
app.use(morgan("dev")); // 👈 логування HTTP-запитів

const orderRouter = require("./routers/order");

const client = new MongoClient(process.env.DB_URL);
let db;

async function startServer() {
  try {
    await client.connect();
    db = client.db("Digi"); // 👈 назва бази (з великої, як у MongoDB)
    console.log("✅ Connected to MongoDB");

    // Передаємо db у роутер
    app.use("/api/order", (req, res, next) => {
      req.db = db;
      next();
    }, orderRouter);

    const PORT = process.env.PORT || 10000;
    app.listen(PORT, () => {
      console.log(`✅ Server is live on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
  }
}

startServer();
