const express = require("express");
const axios = require("axios");
const router = express.Router();

// 🔐 Дані для авторизації
const GIFTERY_LOGIN = process.env.GIFTERY_LOGIN;
const GIFTERY_PASSWORD = process.env.GIFTERY_PASSWORD;

// 🔁 Функція отримання токена
async function getAuthToken() {
  try {
    const response = await axios.post("https://api-stg.giftery.pro:7443/api/v2/authenticate", {
      login: GIFTERY_LOGIN,
      password: GIFTERY_PASSWORD,
    }, {
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      }
    });

    return response.data?.data?.accessToken;
  } catch (error) {
    console.error("❌ Failed to authenticate with Giftery:", error.response?.data || error.message);
    return null;
  }
}

// 📦 Маршрут отримання товарів
router.get("/", async (req, res) => {
  try {
    const token = await getAuthToken();
    if (!token) {
      return res.status(401).json({ error: "Failed to authenticate with Giftery" });
    }

    console.log("🛡️ Access token:", token);

    const response = await axios.get("https://api-stg.giftery.pro:7443/api/v2/products?currency=USD&responseType=short", {
      headers: {
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    res.json(response.data?.data || []);
  } catch (error) {
    console.error("❌ Failed to fetch products from Giftery:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    } else {
      console.error("Message:", error.message);
    }

    res.status(500).json({ error: "Failed to fetch products from Giftery" });
  }
});

module.exports = router;



