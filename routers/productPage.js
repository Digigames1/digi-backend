const express = require("express");
const router = express.Router();
const axios = require("axios");

const {
  BAMBOO_CLIENT_ID,
  BAMBOO_CLIENT_SECRET,
  BAMBOO_BASE_URL
} = process.env;

// 🔐 Отримання токена Bamboo
async function getAccessToken() {
  try {
    const response = await axios.post(
      `${BAMBOO_BASE_URL}/oauth/token`,
      {
        client_id: BAMBOO_CLIENT_ID,
        client_secret: BAMBOO_CLIENT_SECRET,
        grant_type: "client_credentials"
      },
      {
        headers: { "Content-Type": "application/json" }
      }
    );

    return response.data.access_token;
  } catch (error) {
    console.error("❌ Bamboo token fetch error:", error.response?.data || error.message);
    throw new Error("Failed to get Bamboo token");
  }
}

// 📦 Каталог з Bamboo за брендом/регіоном
router.get("/api/:brand/:region?", async (req, res) => {
  const { brand, region } = req.params;
  const name = brand.charAt(0).toUpperCase() + brand.slice(1); // Наприклад: playstation → Playstation

  const params = {
    CurrencyCode: "USD",
    PageSize: 100,
    PageIndex: 0,
    Name: name
  };

  if (region) {
    params.CountryCode = region.toUpperCase();
  }

  console.log("📦 Fetching Bamboo catalog with params:", params);

  try {
    const token = await getAccessToken();

    const response = await axios.get(`${BAMBOO_BASE_URL}/api/integration/v2.0/catalog`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      params
    });

    const catalog = response.data;
    console.log("✅ Received Bamboo data. Count:", catalog.count);

    // ⚠️ Лог всіх назв (щоб бачити що приходить)
    catalog.items.forEach((item, i) => {
      console.log(`${i + 1}. ${item.name} (${item.countryCode}) — ${item.products?.length || 0} products`);
    });

    res.json(catalog);
  } catch (error) {
    console.error("❌ Dynamic route error:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: "Failed to fetch products from Bamboo"
    });
  }
});

module.exports = router;

