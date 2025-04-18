const express = require("express");
const router = express.Router();
const axios = require("axios");

// Дані з .env
const {
  BAMBOO_CLIENT_ID,
  BAMBOO_CLIENT_SECRET,
  BAMBOO_BASE_URL
} = process.env;

// 🔐 Створюємо Basic Auth заголовок вручну
function createBasicAuthHeader() {
  const raw = `${BAMBOO_CLIENT_ID}:${BAMBOO_CLIENT_SECRET}`;
  const encoded = Buffer.from(raw).toString("base64");
  return `Basic ${encoded}`;
}

// 🔁 Отримати продукти з Bamboo по категорії (наприклад, Playstation)
router.get("/api/:brand/:region?", async (req, res) => {
  const { brand, region } = req.params;
  const queryParams = {
    CurrencyCode: "USD",
    PageSize: 100,
    PageIndex: 0,
    Name: brand.charAt(0).toUpperCase() + brand.slice(1)
  };

  if (region) {
    queryParams.CountryCode = region.toUpperCase();
  }

  const catalogUrl = `${BAMBOO_BASE_URL}/api/integration/v2.0/catalog`;

  console.log("📦 Fetching Bamboo catalog with params:", queryParams);

  try {
    const response = await axios.get(catalogUrl, {
      params: queryParams,
      headers: {
        Authorization: createBasicAuthHeader(),
        Accept: "application/json"
      }
    });

    const data = response.data;

    console.log("✅ Received Bamboo data. Count:", data.count);
    res.json(data);
  } catch (error) {
    const err = error.response?.data || error.message;
    console.error("❌ Dynamic route error:", err);
    res.status(error.response?.status || 500).json({ error: "Failed to load Bamboo catalog" });
  }
});

module.exports = router;

