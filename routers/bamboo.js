const express = require("express");
const router = express.Router();
const axios = require("axios");
const { addMarginToPrices } = require("../utils/priceMargin");

const {
  BAMBOO_CLIENT_ID,
  BAMBOO_CLIENT_SECRET,
  BAMBOO_BASE_URL
} = process.env;

router.get("/", async (req, res) => {
  try {
    // 🧾 Формуємо Basic Auth
    const credentials = `${BAMBOO_CLIENT_ID}:${BAMBOO_CLIENT_SECRET}`;
    const encodedAuth = Buffer.from(credentials).toString("base64");

    const url = `${BAMBOO_BASE_URL}/api/integration/v2.0/catalog?CurrencyCode=USD&CountryCode=US&PageSize=100&PageIndex=0`;

    console.log("🌍 Bamboo PRODUCTION URL:", url);

    const response = await axios.get(url, {
      headers: {
        Authorization: `Basic ${encodedAuth}`,
        Accept: "application/json"
      }
    });

    console.log("✅ Bamboo production catalog items:", response.data?.items?.length || 0);

    const dataWithMargin = addMarginToPrices(response.data);
    res.json(dataWithMargin);
  } catch (error) {
    const err = error.response?.data || error.message;
    console.error("❌ Bamboo PRODUCTION fetch error:", err);
    res.status(error.response?.status || 500).json({
      error: "Failed to fetch products from Bamboo Production"
    });
  }
});

module.exports = router;






