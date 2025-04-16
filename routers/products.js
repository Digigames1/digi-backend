const express = require("express");
const router = express.Router();
const axios = require("axios");
const crypto = require("crypto");

const GIFTERY_LOGIN = process.env.GIFTERY_LOGIN;
const GIFTERY_PASSWORD = process.env.GIFTERY_PASSWORD;
const GIFTERY_SECRET = process.env.GIFTERY_SECRET;

router.get("/", async (req, res) => {
  const method = "GET";
  const url = "/api/v2/products?currency=USD&responseType=short";
  const fullUrl = "https://api-stg.giftery.pro:7443" + url;
  const time = Math.floor(Date.now() / 1000).toString();

  const baseString = method + url + time;
  const signature = crypto
    .createHmac("sha256", GIFTERY_SECRET)
    .update(baseString)
    .digest("base64");

  try {
    const response = await axios.get(fullUrl, {
      headers: {
        accept: "application/json",
        login: GIFTERY_LOGIN,
        password: GIFTERY_PASSWORD,
        time,
        signature,
      },
    });

    console.log("✅ Products fetched successfully");
    res.json(response.data.data || []);
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


