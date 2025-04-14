const express = require("express");
const router = express.Router();

router.post("/", (req, res) => {
  const { productId, email, quantity } = req.body;

  if (!productId || !email || !quantity) {
    return res.status(400).json({ error: "Missing order data." });
  }

  console.log("Received order:", { productId, email, quantity });

  res.status(200).json({ message: "Order placed successfully!" });
});

module.exports = router;