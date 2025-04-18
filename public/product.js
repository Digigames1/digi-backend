document.addEventListener("DOMContentLoaded", async () => {
  const brand = window.location.pathname.split("/")[1];
  const region = window.location.pathname.split("/")[2];

  const productsContainer = document.getElementById("products");
  const brandTitle = document.getElementById("brand-title");

  try {
    const apiUrl = region ? `/api/${brand}/${region}` : `/api/${brand}`;
    const res = await fetch(apiUrl);
    const data = await res.json();

    if (!data || !data.items || data.items.length === 0) {
      productsContainer.innerHTML = "<p>Товари не знайдено.</p>";
      return;
    }

    brandTitle.textContent = brand.toUpperCase();

    if (!region) {
      // Показуємо список підкатегорій
      data.items.forEach(item => {
        const link = document.createElement("a");
        link.href = `/${brand}/${item.countryCode.toLowerCase()}`;
        link.textContent = item.name;
        link.className = "subcategory-link";
        productsContainer.appendChild(link);
      });
    } else {
      // Показуємо список товарів у вибраній країні
      data.items.forEach(item => {
        item.products?.forEach(product => {
          const el = document.createElement("div");
          el.className = "product-item";
          el.innerHTML = `
            <div>
              <div class="product-name">${product.name}</div>
              <div class="product-price">$${product.price?.min?.toFixed(2)}</div>
            </div>
            <button class="buy-btn" data-id="${product.id}" data-price="${product.price?.min}">Buy</button>
          `;
          productsContainer.appendChild(el);
        });
      });
    }

  } catch (err) {
    console.error("❌ Load error:", err.message);
    productsContainer.innerHTML = "<p>Помилка завантаження товарів.</p>";
  }
});



