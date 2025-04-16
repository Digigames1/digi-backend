const express = require("express");
const router = express.Router();
const axios = require("axios");

const {
  GIFTERY_API_URL,
  GIFTERY_LOGIN,
  GIFTERY_PASSWORD
} = process.env;

// Генерація токена
async function getToken() {
  const authUrl = `${GIFTERY_API_URL}/authenticate`;

  try {
    const response = await axios.post(authUrl, {
      login: GIFTERY_LOGIN,
      password: GIFTERY_PASSWORD
    });

    return response.data.data.token;
  } catch (err) {
    console.error("❌ Failed to get token from Giftery:", err.response?.data || err.message);
    throw new Error("Token error");
  }
}

router.get("/", async (req, res) => {
  try {
    const token = await getToken();

    const response = await axios.get(`${GIFTERY_API_URL}/products?currency=USD&responseType=short`, {
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${token}` // ⬅️ ОБОВ'ЯЗКОВО!
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error("❌ Auth or fetch error:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ error: "Failed to fetch products from Giftery" });
  }
});

module.exports = router;
