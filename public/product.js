document.addEventListener("DOMContentLoaded", async () => {
  const pathParts = window.location.pathname.split("/").filter(Boolean);
  const [brand, region] = pathParts;

  const container = document.querySelector(".product-container");
  container.innerHTML = "<p>Завантаження...</p>";

  const apiUrl = region
    ? `/api/${brand}/${region}`
    : `/api/${brand}`;

  try {
    const res = await fetch(apiUrl);
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      container.innerHTML = "<p>Товари не знайдено.</p>";
      return;
    }

    if (!region) {
      // 👉 Якщо ми на сторінці /playstation — показуємо регіони
      container.innerHTML = `<h1>${brand.toUpperCase()}</h1>`;
      data.forEach(region => {
        const div = document.createElement("div");
        div.classList.add("brand-box");
        div.innerHTML = `
          <img src="${region.logo}" alt="${region.name}" />
          <h3>${region.region}</h3>
          <a href="/${brand}/${region.region.toLowerCase()}">Переглянути</a>
        `;
        container.appendChild(div);
      });
    } else {
      // 👉 Якщо ми на сторінці /playstation/usa — показуємо товари
      container.innerHTML = `<h1>${brand.toUpperCase()} / ${region.toUpperCase()}</h1>`;
      data.forEach(product => {
        const div = document.createElement("div");
        div.classList.add("product-box");
        div.innerHTML = `
          <img src="${product.logo}" alt="${product.name}" />
          <p><strong>${product.name}</strong></p>
          <p>${product.price} ${product.currency}</p>
          <button onclick="buyProduct(${product.id})">Купити</button>
        `;
        container.appendChild(div);
      });
    }
  } catch (err) {
    console.error("❌ Error loading product:", err);
    container.innerHTML = "<p>Помилка завантаження товарів.</p>";
  }
});

function buyProduct(id) {
  alert(`🛒 Ви вибрали товар з ID: ${id}\nТут буде логіка оплати.`);
}


