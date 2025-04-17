const express = require("express");
const router = express.Router();
const axios = require("axios");

const {
  BAMBOO_CLIENT_ID,
  BAMBOO_CLIENT_SECRET,
  BAMBOO_BASE_URL
} = process.env;

// Отримати токен Bamboo
async function getAccessToken() {
  const tokenUrl = `${BAMBOO_BASE_URL}/v2/oauth/token`;
  console.log("🔐 Отримання токена з:", tokenUrl);

  const response = await axios.post(
    tokenUrl,
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
}

// Отримати продукти з Bamboo
router.get("/", async (req, res) => {
  try {
    const token = await getAccessToken();

    const catalogUrl = `${BAMBOO_BASE_URL}/v2/catalog`;
    console.log("📦 Запит каталогу Bamboo:", catalogUrl);

    const response = await axios.get(catalogUrl, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error("❌ Bamboo fetch error:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: "Failed to fetch products from Bamboo"
    });
  }
});

module.exports = router;





