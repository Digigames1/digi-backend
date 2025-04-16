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

// Запит на отримання товарівconst express = require("express");
const router = express.Router();
const axios = require("axios");

const {
  GIFTERY_API_URL,
  GIFTERY_LOGIN,
  GIFTERY_PASSWORD,
  GIFTERY_SECRET,
} = process.env;

// 🔐 Отримати токен авторизації
async function authenticate() {
  const response = await axios.post(`${GIFTERY_API_URL}/authenticate`, {
    login: GIFTERY_LOGIN,
    password: GIFTERY_PASSWORD,
    secret: GIFTERY_SECRET,
  });

  return response.data?.data?.token;
}

// 🛍️ Отримати продукти
router.get("/", async (req, res) => {
  try {
    const token = await authenticate();

    if (!token) {
      throw new Error("No token received from Giftery");
    }

    const productsResponse = await axios.get(
      `${GIFTERY_API_URL}/products?currency=USD&responseType=short`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }
    );

    const products = productsResponse.data?.data || [];
    res.json(products);
  } catch (error) {
    console.error("❌ Auth error:", error.response?.data || error.message);
    res.status(401).json({ error: "Failed to authenticate with Giftery" });
  }
});

module.exports = router;


