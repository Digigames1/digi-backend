const express = require("express");
const router = express.Router();
const axios = require("axios");

const {
  BAMBOO_CLIENT_ID,
  BAMBOO_CLIENT_SECRET,
  BAMBOO_BASE_URL
} = process.env;

// Отримання токену
async function getAccessToken() {
  const response = await axios.post(
    `${BAMBOO_BASE_URL}/v1/oauth/token`,
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

  console.log("🔐 Bamboo Access Token:", response.data.access_token);
  return response.data.access_token;
}

// Отримання продуктів
router.get("/", async (req, res) => {
  try {
    const token = await getAccessToken();

    const response = await axios.get(`${BAMBOO_BASE_URL}/api/Products`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log("✅ Bamboo Products Fetched:", response.data.length);
    res.json(response.data);
  } catch (error) {
    console.error("❌ Bamboo fetch error:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: "Failed to fetch products from Bamboo"
    });
  }
});

module.exports = router;





