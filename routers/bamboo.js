const express = require("express");
const router = express.Router();
const axios = require("axios");

const {
  BAMBOO_USERNAME,
  BAMBOO_PASSWORD,
  BAMBOO_API_URL
} = process.env;

router.get("/", async (req, res) => {
  try {
    const response = await axios.get(`${BAMBOO_API_URL}/catalogs`, {
      auth: {
        username: BAMBOO_USERNAME,
        password: BAMBOO_PASSWORD
      },
      headers: {
        "Accept": "application/json"
      }
    });

    console.log("✅ Bamboo catalog fetched successfully");
    res.json(response.data);
  } catch (error) {
    console.error("❌ Failed to fetch Bamboo catalog:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ error: "Failed to fetch Bamboo catalog" });
  }
});

module.exports = router;

