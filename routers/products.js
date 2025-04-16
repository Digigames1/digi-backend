const express = require("express");
const router = express.Router();
const axios = require("axios");

const GIFTERY_LOGIN = process.env.GIFTERY_LOGIN;
const GIFTERY_PASSWORD = process.env.GIFTERY_PASSWORD;
const GIFTERY_SECRET = process.env.GIFTERY_SECRET;

router.get("/", async (req, res) => {
  try {
    // 1. Отримуємо токен
    const authResponse = await axios.post("https://api-stg.giftery.pro:7443/api/v2/auth", {
      login: GIFTERY_LOGIN,
      password: GIFTERY_PASSWORD,
    });

    const token = authResponse.data?.token;
    if (!token) {
      throw new Error("Не вдалося отримати токен.");
    }

    // 2. Запит на продукти
    const productsResponse = await axios.get(
      "https://api-stg.giftery.pro:7443/api/v2/products?currency=USD&responseType=short",
      {
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    res.json(productsResponse.data);
  } catch (err) {
    console.error("❌ Failed to fetch products from Giftery:");
    if (err.response) {
      console.error("Status:", err.response.status);
      console.error("Data:", err.response.data);
    } else {
      console.error("Message:", err.message);
    }

    res.status(500).json({ error: "Failed to fetch products from Giftery" });
  }
});

module.exports = router;

