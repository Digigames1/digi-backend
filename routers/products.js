const express = require("express");
const router = express.Router();
const axios = require("axios");

const GIFTERY_LOGIN = process.env.GIFTERY_LOGIN;
const GIFTERY_PASSWORD = process.env.GIFTERY_PASSWORD;

// 1️⃣ Отримуємо access token
async function getAuthToken() {
  const authUrl = "https://api-stg.giftery.pro:7443/api/v2/authenticate";

  const payload = {
    login: GIFTERY_LOGIN,
    password: GIFTERY_PASSWORD
  };

  const headers = {
    "accept": "application/json",
    "Content-Type": "application/json"
  };

  const response = await axios.post(authUrl, payload, { headers });
  return response.data.data.token; // саме тут зберігається токен
}

// 2️⃣ Отримуємо товари
router.get("/", async (req, res) => {
  try {
    const token = await getAuthToken();

    const productUrl = "https://api-stg.giftery.pro:7443/api/v2/products?currency=USD&responseType=short";
    const response = await axios.get(productUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        accept: "application/json",
      }
    });

    const products = response.data.data || [];
    res.json(products);
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


