const express = require("express");
const axios = require("axios");
const router = express.Router();

// 🔐 Дані з .env
const {
  GIFTERY_LOGIN,
  GIFTERY_PASSWORD,
  GIFTERY_API_URL
} = process.env;

// Отримання токена з нового ендпоінта
async function getToken() {
  const authUrl = `${GIFTERY_API_URL}/auth`;

  const response = await axios.post(authUrl, {
    login: GIFTERY_LOGIN,
    password: GIFTERY_PASSWORD
  }, {
    headers: {
      accept: "application/json",
      "Content-Type": "application/json"
    }
  });

  return response.data.data.token;
}

// Отримання списку товарів
router.get("/", async (req, res) => {
  try {
    const token = await getToken();

    const productUrl = `${GIFTERY_API_URL}/products?currency=USD&responseType=short`;
    const response = await axios.get(productUrl, {
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${token}`
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error("❌ Auth or fetch error:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ error: "Failed to fetch products from Giftery" });
  }
});

module.exports = router;


