document.addEventListener("DOMContentLoaded", async () => {
  const path = window.location.pathname.replace("/", "").toLowerCase();
  const container = document.querySelector(".product-container");
  container.innerHTML = "<h1>Loading...</h1>";

  try {
    const res = await fetch("/api/bamboo");
    const data = await res.json();

    // Знаходимо ВСІ айтеми, які містять ключове слово (наприклад, steam)
    const matchingItems = data.items.filter(item =>
      item.name.toLowerCase().includes(path)
    );

    if (!matchingItems.length) {
      container.innerHTML = "<h1>No products found.</h1>";
      return;
    }

    // Беремо загальну інфу з першого
    const brand = matchingItems[0];

    container.innerHTML = `
      <h1>${path.toUpperCase()}</h1>
      <img class="product-logo" src="${brand.logoUrl}" alt="${brand.name}" />
      <p>${brand.description || ""}</p>
      <div class="grid-container" id="product-grid"></div>
    `;

    const grid = document.getElementById("product-grid");

    matchingItems.forEach(item => {
      item.products?.forEach(product => {
        const price = product.price?.min?.toFixed(2) || "N/A";
        const nominal = product.minFaceValue ? `${product.minFaceValue} ${item.currencyCode}` : "N/A";
        grid.innerHTML += `
          <div class="product-card">
            <p><strong>${item.name}</strong></p>
            <p>Nominal: ${nominal}</p>
            <p class="price">Price: $${price}</p>
            <button class="buy-button">Купити</button>
          </div>
        `;
      });
    });

  } catch (err) {
    console.error("❌ Error:", err);
    container.innerHTML = "<h1>Error loading products</h1>";
  }
});


