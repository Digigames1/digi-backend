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

function generateSignature(secret, time) {
  const signature = crypto
    .createHmac("sha256", secret)
    .update(time)
    .digest("base64");

  // 🧾 Логування time і signature
  console.log("🔐 Time:", time);
  console.log("🔐 Signature:", signature);

  return signature;
}

async function getGifteryToken() {
  const time = Math.floor(Date.now() / 1000).toString();
  const signature = generateSignature(GIFTERY_SECRET, time);

  const response = await axios.post(
    `${GIFTERY_API_URL}/auth`,
    {
      login: GIFTERY_LOGIN,
      password: GIFTERY_PASSWORD
    },
    {
      headers: {
        "Content-Type": "application/json",
        "accept": "application/json",
        "time": time,
        "signature": signature
      }
    }
  );

  return response.data.data.token;
}

router.get("/", async (req, res) => {
  try {
    const token = await getGifteryToken();

    const response = await axios.get(
      `${GIFTERY_API_URL}/products?currency=USD&responseType=short`,
      {
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${token}`
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    const errRes = error.response?.data || error.message;
    console.error("❌ Auth or fetch error:", errRes);
    res.status(error.response?.status || 500).json({
      error: "Failed to fetch products from Giftery"
    });
  }
});

module.exports = router;







