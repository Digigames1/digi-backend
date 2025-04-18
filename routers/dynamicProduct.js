const express = require("express");
const axios = require("axios");
const router = express.Router();

const {
  BAMBOO_CLIENT_ID,
  BAMBOO_CLIENT_SECRET,
  BAMBOO_BASE_URL
} = process.env;

function encodeBasicAuth(id, secret) {
  return Buffer.from(`${id}:${secret}`).toString("base64");
}

router.get("/:product", async (req, res) => {
  try {
    const brandName = req.params.product;
    console.log("🔄 Запит бренду:", brandName);
    console.log("🌍 BAMBOO_BASE_URL:", BAMBOO_BASE_URL);

    if (!BAMBOO_BASE_URL) {
      throw new Error("BAMBOO_BASE_URL не вказано");
    }

    const catalogUrl = `${BAMBOO_BASE_URL}/api/integration/v2.0/catalog?PageSize=1000&PageIndex=0`;

    const response = await axios.get(catalogUrl, {
      headers: {
        Authorization: `Basic ${encodeBasicAuth(BAMBOO_CLIENT_ID, BAMBOO_CLIENT_SECRET)}`
      }
    });

    const items = response.data.items || [];

    // Фільтруємо товари по бренду (наприклад, "playstation")
    const filtered = items.filter(item =>
      item.name.toLowerCase().includes(brandName.toLowerCase())
    );

    console.log(`🎯 Знайдено товарів для '${brandName}':`, filtered.length);

    res.send(`
      <html>
        <head>
          <title>${brandName} Products</title>
          <style>
            body {
              font-family: sans-serif;
              padding: 2rem;
              background: #f4f4f4;
            }
            h1 {
              margin-bottom: 1rem;
            }
            .brand {
              background: #fff;
              padding: 1rem;
              margin-bottom: 2rem;
              border-radius: 8px;
              box-shadow: 0 0 10px rgba(0,0,0,0.05);
            }
            .brand img {
              max-width: 150px;
              margin-bottom: 0.5rem;
            }
            .products {
              display: flex;
              flex-wrap: wrap;
              gap: 1rem;
            }
            .product {
              background: #fff;
              padding: 1rem;
              border-radius: 8px;
              width: 200px;
              box-shadow: 0 0 5px rgba(0,0,0,0.05);
            }
            .price {
              font-weight: bold;
              color: #27ae60;
            }
          </style>
        </head>
        <body>
          <h1>${brandName} — ${filtered.length} брендів</h1>

          ${filtered.map(item => `
            <div class="brand">
              <h2>${item.name}</h2>
              <img src="${item.logoUrl}" alt="${item.name}" />
              <p>${item.description || ''}</p>

              <div class="products">
                ${item.products.map(p => `
                  <div class="product">
                    <div><strong>${p.name}</strong></div>
                    <div class="price">${p.price.min} ${p.price.currencyCode}</div>
                  </div>
                `).join("")}
              </div>
            </div>
          `).join("")}
        </body>
      </html>
    `);
  } catch (err) {
    console.error("❌ Dynamic route error:", err.message);
    res.status(500).send("Error loading products.");
  }
});

module.exports = router;
