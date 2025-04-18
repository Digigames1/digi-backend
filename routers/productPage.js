const express = require("express");
const router = express.Router();
const axios = require("axios");

const {
  BAMBOO_CLIENT_ID,
  BAMBOO_CLIENT_SECRET
} = process.env;

const BASE_URL = "https://api.bamboocardportal.com";

// 🔐 Авторизація
async function getAccessToken() {
  const response = await axios.post(
    `${BASE_URL}/v1/oauth/token`,
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
  return response.data.access_token;
}

// 📘 1. Повертає список підкатегорій (наприклад: USA, EUR, HKD)
router.get("/api/:brand", async (req, res) => {
  const { brand } = req.params;
  try {
    const token = await getAccessToken();

    const response = await axios.get(
      `${BASE_URL}/api/integration/v2.0/catalog?CurrencyCode=USD&CountryCode=US&PageSize=100&PageIndex=0`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const items = response.data.items || [];

    // 🔍 Фільтруємо потрібний бренд
    const filtered = items.filter(item =>
      item.name.toLowerCase().includes(brand.toLowerCase())
    );

    // 🧠 Витягуємо унікальні підкатегорії
    const regions = [...new Set(
      filtered.map(item => {
        const name = item.name.toLowerCase();
        const region = name.replace(brand.toLowerCase(), "").trim();
        return region || "global";
      })
    )];

    res.json(regions);
  } catch (error) {
    console.error("❌ Dynamic route error:", error.message);
    res.status(500).json({ error: "Failed to load regions" });
  }
});

// 📘 2. Повертає товари для підкатегорії (наприклад: Playstation USA)
router.get("/api/:brand/:region", async (req, res) => {
  const { brand, region } = req.params;

  try {
    const token = await getAccessToken();

    const response = await axios.get(
      `${BASE_URL}/api/integration/v2.0/catalog?CurrencyCode=USD&CountryCode=US&PageSize=100&PageIndex=0`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const items = response.data.items || [];

    const products = [];

    items.forEach(item => {
      const name = item.name.toLowerCase();
      const cleanedName = name.replace(/\s+/g, "");
      const matchName = brand.toLowerCase();
      const matchRegion = region.toLowerCase();

      if (cleanedName.includes(matchName) && cleanedName.includes(matchRegion)) {
        item.products.forEach(product => {
          products.push({
            name: product.name,
            brand: item.name,
            logo: item.logoUrl,
            description: item.description,
            price: product.price?.min,
            currency: product.price?.currencyCode,
          });
        });
      }
    });

    res.json(products);
  } catch (error) {
    console.error("❌ Dynamic fetch error:", error.message);
    res.status(500).json({ error: "Failed to load products for this region" });
  }
});

module.exports = router;

