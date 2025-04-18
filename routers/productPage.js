const express = require("express");
const router = express.Router();
const axios = require("axios");

const {
  BAMBOO_CLIENT_ID,
  BAMBOO_CLIENT_SECRET
} = process.env;

// 🔐 Формуємо базову авторизацію
const authHeader = "Basic " + Buffer.from(`${BAMBOO_CLIENT_ID}:${BAMBOO_CLIENT_SECRET}`).toString("base64");

router.get("/api/:brand/:region?", async (req, res) => {
  const { brand, region } = req.params;

  // Фільтруємо товари по brand + optional region
  const brandQuery = brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase(); // Capitalize
  const regionQuery = region ? region.toUpperCase() : null;

  const bambooUrl = "https://api.bamboocardportal.com/api/integration/v2.0/catalog";

  const params = {
    CurrencyCode: "USD",
    PageSize: 100,
    PageIndex: 0
  };

  if (brandQuery) params.Name = brandQuery;
  if (regionQuery) params.CountryCode = regionQuery;

  console.log("📦 Fetching Bamboo catalog with params:", params);

  try {
    const response = await axios.get(bambooUrl, {
      headers: {
        Authorization: authHeader
      },
      params
    });

    console.log("✅ Received Bamboo data. Count:", response.data?.items?.length || 0);
    res.json(response.data);
  } catch (err) {
    console.error("❌ Dynamic route error:", err.response?.data || err.message);
    res.status(err.response?.status || 500).json({
      error: "Failed to fetch product data"
    });
  }
});

module.exports = router;
