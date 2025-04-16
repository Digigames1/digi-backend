const express = require("express");
const axios = require("axios");
const router = express.Router();

const {
  GIFTERY_API_URL,
  GIFTERY_LOGIN,
  GIFTERY_PASSWORD,
  GIFTERY_SECRET,
} = process.env;

// 🔐 Авторизація в Giftery
async function authenticate() {
  const response = await axios.post(`${GIFTERY_API_URL}/authenticate`, {
    login: GIFTERY_LOGIN,
    password: GIFTERY_PASSWORD,
    secret: GIFTERY_SECRET,
  });

  return response.data?.data?.token;
}

// 🛍️ Отримання продуктів
router.get("/", async (req, res) => {
  try {
    const token = await authenticate();

    if (!token) {
      throw new Error("Token not received from Giftery");
    }

    const productResponse = await axios.get(
      `${GIFTERY_API_URL}/products?currency=USD&responseType=short`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }
    );

    const products = productResponse.data?.data || [];
    res.json(products);
  } catch (error) {
    console.error("❌ Auth or fetch error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch products from Giftery" });
  }
});

module.exports = router;

