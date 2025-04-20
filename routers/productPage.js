const express = require("express");
const router = express.Router();
const axios = require("axios");

const {
  BAMBOO_CLIENT_ID,
  BAMBOO_CLIENT_SECRET,
  BAMBOO_BASE_URL
} = process.env;

function createBasicAuthHeader() {
  const raw = `${BAMBOO_CLIENT_ID}:${BAMBOO_CLIENT_SECRET}`;
  const encoded = Buffer.from(raw).toString("base64");
  return `Basic ${encoded}`;
}

// 🔎 Пошук
router.get("/api/search", async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: "Missing query" });

  const params = {
    CurrencyCode: "USD",
    PageSize: 100,
    PageIndex: 0,
    Name: query
  };

  try {
    const response = await axios.get(`${BAMBOO_BASE_URL}/api/integration/v2.0/catalog`, {
      headers: {
        Authorization: createBasicAuthHeader(),
        Accept: "application/json"
      },
      params
    });

    console.log(`🔍 Search results for "${query}":`, response.data.count);
    res.json(response.data);
  } catch (err) {
    console.error("❌ Search error:", err.response?.data || err.message);
    res.status(500).json({ error: "Search failed." });
  }
});

// 🧭 Основна логіка: отримати продукти по бренду/регіону
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

  try {
    const response = await axios.get(catalogUrl, {
      params: queryParams,
      headers: {
        Authorization: createBasicAuthHeader(),
        Accept: "application/json"
      }
    });

    res.json(response.data);
  } catch (error) {
    const err = error.response?.data || error.message;
    console.error("❌ Dynamic route error:", err);
    res.status(error.response?.status || 500).json({ error: "Failed to load Bamboo catalog" });
  }
});

module.exports = router;

