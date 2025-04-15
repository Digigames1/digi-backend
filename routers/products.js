const express = require("express");
const router = express.Router();
const axios = require("axios");

// API доступ
const LOGIN = process.env.GIFTERY_LOGIN;
const PASSWORD = process.env.GIFTERY_PASSWORD;

router.get("/", async (req, res) => {
  try {
    const response = await axios.get("https://api.giftery.ru/", {
      params: {
        api: "partner.gifts.get",
        login: LOGIN,
        password: PASSWORD
      }
    });

    const products = response.data.result || [];
    res.json(products);
  } catch (err) {
    console.error("❌ Failed to fetch Giftery products:", err.message);
    res.status(500).json({ error: "Failed to fetch products from Giftery." });
  }
});

module.exports = router;
