const express = require("express");
const router = express.Router();
const axios = require("axios");

// 🔐 Дані з .env
const GIFTERY_LOGIN = process.env.GIFTERY_LOGIN;
const GIFTERY_PASSWORD = process.env.GIFTERY_PASSWORD;

// Отримати токен від Giftery
async function getAuthToken() {
  try {
    const response = await axios({
      method: "post",
      url: "https://api-stg.giftery.pro:7443/api/v2/authenticate",
      headers: {
        "accept": "application/json",
        "Content-Type": "application/json"
      },
      data: {
        login: GIFTERY_LOGIN,
        password: GIFTERY_PASSWORD
      }
    });

    return response.data?.data?.accessToken;
  } catch (error) {
    console.error("❌ Auth error:", error.response?.data || error.message);
    return null;
  }
}

// Запит на отримання товарів
router.get("/", async (req, res) => {
  try {
    const token = await getAuthToken();
    if (!token) {
      return res.status(401).json({ error: "❌ Authentication failed" });
    }

    const response = await axios.get(
      "https://api-stg.giftery.pro:7443/api/v2/products?currency=USD&responseType=short",
      {
        headers: {
          "accept": "application/json",
          "Authorization": `Bearer ${token}`,
        }
      }
    );

    res.json(response.data?.data || []);
  } catch (error) {
    console.error("❌ Failed to fetch products:", error.response?.data || error.message);
    res.status(500).json({ error: "❌ Failed to fetch products from Giftery" });
  }
});

module.exports = router;


