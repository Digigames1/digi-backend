const express = require("express");
const router = express.Router();
const axios = require("axios");

router.get("/:brand/:region?", async (req, res) => {
  const { brand, region } = req.params;

  try {
    const response = await axios.get(`${process.env.BASE_URL}/api/bamboo`);
    const data = response.data.items;

    // 1. Знайдемо всі товари бренду
    const filtered = data.filter(item =>
      item.name.toLowerCase().includes(brand.toLowerCase())
    );

    if (!region) {
      // Якщо НЕ вказана підкатегорія — показати лише регіони
      const regions = [...new Set(filtered.map(item => item.countryCode))];
      const regionGroups = regions.map(code => {
        const brandItem = filtered.find(i => i.countryCode === code);
        return {
          countryCode: code,
          brandName: brandItem?.name,
          logoUrl: brandItem?.logoUrl
        };
      });

      return res.json({ mode: "categories", brand, categories: regionGroups });
    } else {
      // Якщо вказана підкатегорія (регіон) — показати товари
      const regionFiltered = filtered.find(item =>
        item.name.toLowerCase().includes(region.toLowerCase())
      );

      return res.json({ mode: "products", brand, ...regionFiltered });
    }
  } catch (err) {
    console.error("❌ Dynamic route error:", err.message);
    res.status(500).json({ error: "Failed to load products" });
  }
});

module.exports = router;
