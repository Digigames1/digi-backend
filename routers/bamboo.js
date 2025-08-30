import express from "express";
import axios from "axios";
import { authHeaders } from "../src/catalog/auth.mjs";
import { addMarginToPrices } from "../utils/priceMargin.js";

const router = express.Router();
const { BAMBOO_BASE_URL } = process.env;

router.get("/", async (_req, res) => {
  try {
    const headers = { Accept: "application/json", ...(await authHeaders()) };
    const url = `${BAMBOO_BASE_URL}/api/integration/v2.0/catalog?CurrencyCode=USD&CountryCode=US&PageSize=100&PageIndex=0`;

    console.log("🌍 Bamboo PRODUCTION URL:", url);

    const response = await axios.get(url, { headers });

    console.log("✅ Bamboo production catalog items:", response.data?.items?.length || 0);

    const dataWithMargin = addMarginToPrices(response.data);
    res.json(dataWithMargin);
  } catch (error) {
    const err = error.response?.data || error.message;
    console.error("❌ Bamboo PRODUCTION fetch error:", err);
    res.status(error.response?.status || 500).json({
      error: "Failed to fetch products from Bamboo Production"
    });
  }
});

export default router;






