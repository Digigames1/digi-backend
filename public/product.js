document.addEventListener("DOMContentLoaded", async () => {
  const brand = window.location.pathname.split("/")[1];
  const region = window.location.pathname.split("/")[2];

  const productsContainer = document.getElementById("products");
  const brandTitle = document.getElementById("brand-title");

  try {
    const apiUrl = region ? `/api/${brand}/${region}` : `/api/${brand}`;
    const res = await fetch(apiUrl);
    const data = await res.json();

    if (!data || !data.items || !data.items.length) {
      productsContainer.innerHTML = "<p>Товари не знайдено.</p>";
      return;
    }

    brandTitle.textContent = brand.toUpperCase();

    const grouped = {};

    data.items.forEach(item => {
      const groupKey = item.name;
      if (!grouped[groupKey]) grouped[groupKey] = [];
      grouped[groupKey].push(item);
    });

    for (const group in grouped) {
      const subcategory = document.createElement("div");
      subcategory.className = "subcategory";

      const title = document.createElement("div");
      title.className = "subcategory-title";
      title.textContent = group;

      const list = document.createElement("div");
      list.className = "product-list";

      grouped[group].forEach(product => {
        if (!product.price || typeof product.price.min !== "number") return; // 🛡️ Перевірка

        const productEl = document.createElement("div");
        productEl.className = "product-item";
        productEl.innerHTML = `
          <div>
            <div class="product-name">${product.name}</div>
            <div class="product-price">$${product.price.min.toFixed(2)}</div>
          </div>
          <button class="buy-btn" data-id="${product.id}" data-price="${product.price.min}">Buy</button>
        `;
        list.appendChild(productEl);
      });

      subcategory.appendChild(title);
      subcategory.appendChild(list);
      productsContainer.appendChild(subcategory);
    }

  } catch (err) {
    console.error("❌ Load error:", err.message);
    productsContainer.innerHTML = "<p>Помилка завантаження товарів.</p>";
  }
});



