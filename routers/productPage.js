const express = require("express");
const router = express.Router();
const axios = require("axios");

const {
  BAMBOO_CLIENT_ID,
  BAMBOO_CLIENT_SECRET,
  BAMBOO_BASE_URL
} = process.env;

// 🔐 Basic Auth
function createBasicAuthHeader() {
  const raw = `${BAMBOO_CLIENT_ID}:${BAMBOO_CLIENT_SECRET}`;
  const encoded = Buffer.from(raw).toString("base64");
  return `Basic ${encoded}`;
}

// 🔁 Динамічні категорії /api/:brand/:region?
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

    console.log("✅ Received Bamboo data. Count:", response.data.count);
    res.json(response.data);
  } catch (error) {
    const err = error.response?.data || error.message;
    console.error("❌ Dynamic route error:", err);
    res.status(error.response?.status || 500).json({ error: "Failed to load Bamboo catalog" });
  }
});

// 🔍 Локальний пошук по всьому каталогу Bamboo
router.get("/api/search", async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: "Missing query parameter" });
  }

  const catalogUrl = `${BAMBOO_BASE_URL}/api/integration/v2.0/catalog`;

  try {
    const response = await axios.get(catalogUrl, {
      params: {
        CurrencyCode: "USD",
        PageSize: 100,
        PageIndex: 0,
      },
      headers: {
        Authorization: createBasicAuthHeader(),
        Accept: "application/json"
      }
    });

    const items = response.data.items || [];

    const filtered = items.filter(item => {
      const brandMatch = item.name?.toLowerCase().includes(query.toLowerCase());
      const productMatch = item.products?.some(p =>
        p.name?.toLowerCase().includes(query.toLowerCase())
      );
      return brandMatch || productMatch;
    });

    console.log(`🔍 Local search for "${query}", results: ${filtered.length}`);
    res.json({
      pageIndex: 0,
      pageSize: 100,
      count: filtered.length,
      items: filtered
    });

  } catch (error) {
    const err = error.response?.data || error.message;
    console.error("❌ Search route error:", err);
    res.status(error.response?.status || 500).json({ error: "Failed to search products" });
  }
});

module.exports = router;
