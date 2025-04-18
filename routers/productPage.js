const express = require("express");
const router = express.Router();
const axios = require("axios");

// 🔐 Змінні з .env
const BAMBOO_BASE_URL = "https://api.bamboocardportal.com"; // продакшен
const BAMBOO_CATALOG_ENDPOINT = `${BAMBOO_BASE_URL}/api/integration/v2.0/catalog`;

const params = {
  CurrencyCode: "USD",
  CountryCode: "US",
  PageSize: 100,
  PageIndex: 0,
};

// ✅ 1. Отримати всі регіони певного бренду
router.get("/api/:brand", async (req, res) => {
  const { brand } = req.params;

  try {
    const response = await axios.get(BAMBOO_CATALOG_ENDPOINT, { params });

    const regions = response.data.items
      .filter(item => item.name.toLowerCase().includes(brand.toLowerCase()))
      .map(item => ({
        name: item.name,
        region: extractRegion(item.name),
        logo: item.logoUrl,
      }));

    res.json(regions);
  } catch (error) {
    console.error("❌ Dynamic route error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch brand category" });
  }
});

// ✅ 2. Отримати товари для конкретного регіону бренду
router.get("/api/:brand/:region", async (req, res) => {
  const { brand, region } = req.params;

  try {
    const response = await axios.get(BAMBOO_CATALOG_ENDPOINT, { params });

    const filtered = response.data.items.filter(item =>
      item.name.toLowerCase().includes(brand.toLowerCase()) &&
      item.name.toLowerCase().includes(region.toLowerCase())
    );

    const products = filtered.flatMap(item =>
      item.products.map(prod => ({
        id: prod.id,
        name: prod.name,
        price: prod.price?.min || "N/A",
        currency: prod.price?.currencyCode || "USD",
        logo: item.logoUrl || "",
      }))
    );

    res.json(products);
  } catch (error) {
    console.error("❌ Dynamic route error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch brand region" });
  }
});

// 🔎 Витягуємо регіон з назви
function extractRegion(name) {
  const parts = name.split(" ");
  return parts.length > 1 ? parts.slice(1).join(" ") : "global";
}

module.exports = router;


