const express = require("express");
const router = express.Router();
const axios = require("axios");

const {
  BAMBOO_CLIENT_ID,
  BAMBOO_CLIENT_SECRET,
  BAMBOO_BASE_URL
} = process.env;

// 🔍 Лог базового URL для перевірки
console.log("🌍 BAMBOO_BASE_URL =", BAMBOO_BASE_URL);

// Функція для отримання токена
async function getAccessToken() {
  const url = `${BAMBOO_BASE_URL}/v1/oauth/token`;

  console.log("🔐 Отримання токена з:", url);

  const response = await axios.post(
    url,
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

  console.log("✅ Bamboo токен отримано");
  return response.data.access_token;
}

// Отримати список продуктів
router.get("/", async (req, res) => {
  try {
    const token = await getAccessToken();

    const catalogUrl = `${BAMBOO_BASE_URL}/v1/catalog`;
    console.log("📦 Запит до каталогу:", catalogUrl);

    const response = await axios.get(catalogUrl, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log("✅ Отримано продукти з Bamboo:", response.data?.length || "✓");
    res.json(response.data);
  } catch (error) {
    const errData = error.response?.data || error.message;
    console.error("❌ Bamboo fetch error:", errData);
    res.status(error.response?.status || 500).json({
      error: "Failed to fetch products from Bamboo"
    });
  }
});

module.exports = router;




