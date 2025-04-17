const express = require("express");
const axios = require("axios");
const router = express.Router();

const {
  BAMBOO_CLIENT_ID,
  BAMBOO_CLIENT_SECRET,
  BAMBOO_API_URL
} = process.env;

async function getBambooToken() {
  const response = await axios.post(`${BAMBOO_API_URL}/token`, null, {
    params: {
      grant_type: "client_credentials",
      client_id: BAMBOO_CLIENT_ID,
      client_secret: BAMBOO_CLIENT_SECRET
    },
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    }
  });

  return response.data.access_token;
}

router.get("/", async (req, res) => {
  try {
    const token = await getBambooToken();

    const response = await axios.get(`${BAMBOO_API_URL}/Products`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error("❌ Bamboo fetch error:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ error: "Failed to fetch products from Bamboo" });
  }
});

module.exports = router;


