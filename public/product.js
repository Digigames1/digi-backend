document.addEventListener("DOMContentLoaded", async () => {
  const path = window.location.pathname.replace("/", "").toLowerCase();

  const container = document.querySelector(".product-container");
  container.innerHTML = "<h1>Loading...</h1>";

  try {
    const res = await fetch("/api/bamboo");
    const data = await res.json();

    const brand = data.items.find(item =>
      item.name.toLowerCase().includes(path)
    );

    if (!brand) {
      container.innerHTML = "<h1>Error loading product.</h1>";
      return;
    }

    // Очистити і почати виводити товари
    container.innerHTML = `
      <h1>${brand.name}</h1>
      <img class="product-logo" src="${brand.logoUrl}" alt="${brand.name}" />
      <p>${brand.description}</p>
    `;

    if (!brand.products || brand.products.length === 0) {
      container.innerHTML += `<p>No products available.</p>`;
      return;
    }

    // Виводимо всі товари в бренді
    brand.products.forEach((product) => {
      const price = product.price?.min?.toFixed(2) || "N/A";
      const productHTML = `
        <div style="margin-top: 1rem; padding: 1rem; border-top: 1px solid #ccc;">
          <p><strong>Nominal:</strong> ${product.minFaceValue} ${brand.currencyCode}</p>
          <p class="price">Price: $${price}</p>
          <button class="buy-button">🛒 Купити</button>
        </div>
      `;
      container.innerHTML += productHTML;
    });

  } catch (error) {
    console.error("❌ Error:", error);
    container.innerHTML = "<h1>Failed to load product details.</h1>";
  }
});


