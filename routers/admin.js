const express = require("express");
const router = express.Router();

const ADMIN_TOKEN = process.env.ADMIN_TOKEN; // Токен беремо з .env

router.get("/orders", async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || authHeader !== `Bearer ${ADMIN_TOKEN}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const orders = await req.db.collection("orders").find().toArray();
    res.status(200).json(orders);
  } catch (err) {
    console.error("Admin fetch error:", err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

module.exports = router;

