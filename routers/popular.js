const express = require("express");
const router = express.Router();

router.get("/", async (req, res) => {
  const db = req.db;

  try {
    const popular = await db.collection("orders").aggregate([
      { $group: { _id: "$productId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "products", // назва колекції з товарами
          localField: "_id",
          foreignField: "id",
          as: "product"
        }
      },
      { $unwind: "$product" },
      {
        $project: {
          id: "$product.id",
          name: "$product.name",
          image: "$product.image",
          count: 1
        }
      }
    ]).toArray();

    res.json(popular);
  } catch (err) {
    console.error("❌ Error loading popular products:", err);
    res.status(500).json({ error: "Failed to fetch popular products" });
  }
});

module.exports = router;
