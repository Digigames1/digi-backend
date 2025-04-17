const express = require("express");
const router = express.Router();
const axios = require("axios");

const {
  BAMBOO_CLIENT_ID,
  BAMBOO_CLIENT_SECRET,
  BAMBOO_BASE_URL
} = process.env;

// Отримання токена (OAuth2 Client Credentials Flow)
async function getAccessToken() {
  const url = `${BAMBOO_BASE_URL}/oauth/token`;
  console.log("🔐 Отримання токена з:", url);

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

  console.log("✅ Bamboo токен отримано");
  return response.data.access_token;
}

// Запит на каталог
router.get("/", async (req, res) => {
  try {
    const token = await getAccessToken();

    const url = `${BAMBOO_BASE_URL}/v2/catalogs`;
    console.log("📦 Отримання каталогу з:", url);

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json"
      }
    });

    console.log("✅ Каталог отримано:", Array.isArray(response.data) ? response.data.length : "об'єкт");

    res.json(response.data);
  } catch (error) {
    console.error("❌ Bamboo fetch error:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: "Failed to fetch products from Bamboo"
    });
  }
});

module.exports = router;




