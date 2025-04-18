const express = require("express");
const router = express.Router();
const axios = require("axios");
const base64 = require("base-64");

const {
  BAMBOO_CLIENT_ID,
  BAMBOO_CLIENT_SECRET,
  BAMBOO_BASE_URL
} = process.env;

// Створити Basic Auth заголовок
function createBasicAuthHeader() {
  const token = base64.encode(`${BAMBOO_CLIENT_ID}:${BAMBOO_CLIENT_SECRET}`);
  return `Basic ${token}`;
}

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

  console.log("📦 Fetching Bamboo catalog with params:", queryParams);

  try {
    const response = await axios.get(`${BAMBOO_BASE_URL}/api/integration/v2.0/catalog`, {
      headers: {
        Authorization: createBasicAuthHeader()
      },
      params: queryParams
    });

    console.log(`✅ Received Bamboo data. Count: ${response.data.count}`);
    res.json(response.data);
  } catch (error) {
    console.error("❌ Bamboo fetch error:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ error: "Failed to fetch products from Bamboo" });
  }
});

module.exports = router;

