const express = require("express");
const router = express.Router();
const axios = require("axios");

const GIFTERY_LOGIN = process.env.GIFTERY_LOGIN;
const GIFTERY_PASSWORD = process.env.GIFTERY_PASSWORD;
const GIFTERY_SECRET = process.env.GIFTERY_SECRET;

router.get("/", async (req, res) => {
  try {
    const payload = {
      login: GIFTERY_LOGIN,
      password: GIFTERY_PASSWORD,
      secret: GIFTERY_SECRET,
      params: {
        category_id: null,   // можеш задати ID категорії
        currency: "USD",     // спробуй також "RUB" або "EUR"
        lang: "en"           // або "ru"
      }
    };

    const response = await axios.post("https://api.giftery.ru/v2/marketplace/catalog", payload);

    console.log("✅ Giftery API success. Raw response:");
    console.dir(response.data, { depth: null });

    const products = response.data?.data || [];

    if (products.length === 0) {
      console.warn("⚠️ Giftery API returned an empty product list.");
    }

    res.status(200).json(products);
  } catch (error) {
    console.error("❌ Failed to fetch products from Giftery:");

    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    } else {
      console.error("Message:", error.message);
    }

    res.status(500).json({ error: "Failed to fetch products from Giftery" });
  }
});

module.exports = router;
