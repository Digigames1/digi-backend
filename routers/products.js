const express = require("express");
const axios = require("axios");
const crypto = require("crypto");
const router = express.Router();

const {
  GIFTERY_LOGIN,
  GIFTERY_PASSWORD,
  GIFTERY_SECRET,
  GIFTERY_API_URL
} = process.env;

function generateSignature(time, secret) {
  return crypto.createHmac("sha256", secret)
    .update(time)
    .digest("base64");
}

async function getToken() {
  const time = Math.floor(Date.now() / 1000).toString();
  const signature = generateSignature(time, GIFTERY_SECRET);

  const headers = {
    "Content-Type": "application/json",
    time,
    signature
  };

  const body = {
    login: GIFTERY_LOGIN,
    password: GIFTERY_PASSWORD
  };

  const response = await axios.post(`${GIFTERY_API_URL}/auth`, body, { headers });
  return response.data.data.token;
}

router.get("/", async (req, res) => {
  try {
    const token = await getToken();

    const response = await axios.get(`${GIFTERY_API_URL}/products?currency=USD&responseType=short`, {
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${token}`
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error("❌ Auth or fetch error:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ error: "Failed to fetch products from Giftery" });
  }
});

module.exports = router;

