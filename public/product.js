const pathParts = window.location.pathname.split("/").filter(Boolean);
const [brand, region] = pathParts;

const apiUrl = `/api/${brand}${region ? `/${region}` : ""}`;
const container = document.querySelector(".product-container");

fetch(apiUrl)
  .then(res => res.json())
  .then(data => {
    const items = data.items || [];

    if (!items.length) {
      container.innerHTML = `<p>Товари не знайдено.</p>`;
      return;
    }

    // Якщо ми на сторінці /brand (наприклад /playstation)
    if (!region) {
      const regionsShown = new Set();

      container.innerHTML = `<h1>${brand.toUpperCase()}</h1>`;

      items.forEach(item => {
        const regionCode = item.countryCode?.toLowerCase();

        if (!regionsShown.has(regionCode)) {
          regionsShown.add(regionCode);
          const link = document.createElement("a");
          link.href = `/${brand}/${regionCode}`;
          link.textContent = `${item.name} (${regionCode.toUpperCase()})`;
          link.style.display = "block";
          link.style.margin = "0.5rem 0";
          container.appendChild(link);
        }
      });

    } else {
      // Якщо ми на сторінці /brand/region (наприклад /playstation/usa)
      container.innerHTML = `<h1>${brand.toUpperCase()} — ${region.toUpperCase()}</h1>`;

      items.forEach(item => {
        item.products?.forEach(product => {
          const box = document.createElement("div");
          box.style.border = "1px solid #ccc";
          box.style.margin = "1rem 0";
          box.style.padding = "1rem";
          box.style.borderRadius = "8px";
          box.innerHTML = `
            <h3>${product.name}</h3>
            <p>💰 ${product.price.min} ${product.price.currencyCode}</p>
            <button onclick="alert('Додано до кошика!')">Купити</button>
          `;
          container.appendChild(box);
        });
      });
    }
  })
  .catch(err => {
    console.error("❌ Failed to load product:", err);
    container.innerHTML = `<p>Помилка завантаження товару</p>`;
  });


