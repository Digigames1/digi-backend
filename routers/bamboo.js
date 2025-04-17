const express = require("express");
const router = express.Router();
const axios = require("axios");

const {
  BAMBOO_CLIENT_ID,
  BAMBOO_CLIENT_SECRET,
  BAMBOO_BASE_URL
} = process.env;

// 👉 Генеруємо Basic Token
function getBasicAuthToken() {
  const credentials = `${BAMBOO_CLIENT_ID}:${BAMBOO_CLIENT_SECRET}`;
  return Buffer.from(credentials).toString("base64");
}

router.get("/", async (req, res) => {
  try {
    const authToken = getBasicAuthToken();

    const url = `${BAMBOO_BASE_URL}/api/integration/v2.0/catalog?CurrencyCode=USD&CountryCode=US&PageSize=100&PageIndex=0`;

    console.log("📦 Bamboo catalog request to:", url);

    const response = await axios.get(url, {
      headers: {
        Authorization: `Basic ${authToken}`,
        Accept: "application/json"
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error("❌ Bamboo fetch error:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: "Failed to fetch products from Bamboo"
    });
  }
});

module.exports = router;






