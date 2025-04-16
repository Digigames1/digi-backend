const express = require("express");
const router = express.Router();
const axios = require("axios");

const {
  GIFTERY_LOGIN,
  GIFTERY_PASSWORD,
  GIFTERY_API_URL
} = process.env;

// Отримання токена
async function getToken() {
  const url = `${GIFTERY_API_URL}/api/v2/authenticate`;

  const response = await axios.post(url, {
    login: GIFTERY_LOGIN,
    password: GIFTERY_PASSWORD
  });

  return response.data.data.token;
}

router.get("/", async (req, res) => {
  try {
    const token = await getToken();

    const url = `${GIFTERY_API_URL}/api/v2/products?currency=USD&responseType=short`;
    const response = await axios.get(url, {
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

