const express = require("express");
const router = express.Router();
const axios = require("axios");
const crypto = require("crypto");

// 🔐 Дані з .env
const {
  GIFTERY_LOGIN,
  GIFTERY_PASSWORD,
  GIFTERY_SECRET,
  GIFTERY_API_URL
} = process.env;

// 🔁 Генерація HMAC-підпису
function generateSignature(login, password, secret, time) {
  const data = login + password + time;
  const hmac = crypto.createHmac("sha256", secret).update(data).digest("base64");
  return hmac;
}

router.get("/", async (req, res) => {
  const time = Math.floor(Date.now() / 1000); // поточний час в секундах
  const signature = generateSignature(GIFTERY_LOGIN, GIFTERY_PASSWORD, GIFTERY_SECRET, time);

  try {
    const response = await axios.get(`${GIFTERY_API_URL}/products?currency=USD&responseType=short`, {
      headers: {
        accept: "application/json",
        time: time.toString(),
        signature: signature,
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error("❌ Auth or fetch error:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ error: "Failed to fetch products from Giftery" });
  }
});

module.exports = router;

