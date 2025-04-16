const express = require("express");
const router = express.Router();
const axios = require("axios");
const crypto = require("crypto");

const GIFTERY_SECRET = process.env.GIFTERY_SECRET;

// ⏱ Отримуємо Unix time
function getUnixTime() {
  return Math.floor(Date.now() / 1000);
}

// 🔐 Створюємо підпис (signature)
function generateSignature(secret, time) {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(String(time));
  return hmac.digest("base64");
}

router.get("/", async (req, res) => {
  const time = getUnixTime();
  const signature = generateSignature(GIFTERY_SECRET, time);

  const url = `https://api-stg.giftery.pro:7443/api/v2/products?currency=USD&responseType=short`;

  try {
    const response = await axios.get(url, {
      headers: {
        accept: "application/json",
        time: time,
        signature: signature,
      },
    });

    res.json(response.data);
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

