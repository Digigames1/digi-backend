const express = require("express");
const router = express.Router();
const axios = require("axios");

const {
  BAMBOO_CLIENT_ID,
  BAMBOO_CLIENT_SECRET,
  BAMBOO_BASE_URL
} = process.env;

// Отримати токен доступу
async function getBambooToken() {
  const url = `${BAMBOO_BASE_URL}/oauth/token`;
  console.log("🔐 Отримання токена з:", url);

  try {
    const response = await axios.post(
      url,
      {
        client_id: BAMBOO_CLIENT_ID,
        client_secret: BAMBOO_CLIENT_SECRET,
        grant_type: "client_credentials"
      },
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    return response.data.access_token;
  } catch (error) {
    console.error("❌ Bamboo token fetch error:", error.response?.data || error.message);
    throw new Error("Failed to get Bamboo token");
  }
}

// Маршрут для бренду (наприклад /playstation або /steam)
router.get("/api/:brand/:region?", async (req, res) => {
  const { brand, region } = req.params;

  const queryParams = {
    CurrencyCode: "USD",
    PageSize: 100,
    PageIndex: 0,
    Name: brand.charAt(0).toUpperCase() + brand.slice(1) // e.g. 'playstation'
  };

  if (region) {
    queryParams.CountryCode = region.toUpperCase();
  }

  console.log("📦 Fetching Bamboo catalog with params:", queryParams);

  try {
    const token = await getBambooToken();

    const response = await axios.get(`${BAMBOO_BASE_URL}/api/integration/v2.0/catalog`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      params: queryParams
    });

    console.log(`✅ Received Bamboo data. Count: ${response.data.count}`);
    res.json(response.data);
  } catch (error) {
    console.error("❌ Dynamic route error:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ error: "Failed to fetch products from Bamboo" });
  }
});

module.exports = router;
