document.addEventListener("DOMContentLoaded", async () => {
  const pathParts = window.location.pathname.split("/").filter(Boolean);
  const [brand, region] = pathParts;

  const container = document.querySelector(".product-container");
  container.innerHTML = "<p>Loading...</p>";

  try {
    const res = await fetch(`/api/${brand}/${region || ""}`);
    const data = await res.json();

    if (region) {
      // 🧾 Детальна сторінка підкатегорії (наприклад: /playstation/usa)
      container.innerHTML = `
        <h1>${data.name}</h1>
        <img src="${data.logoUrl}" alt="${data.name}" class="product-logo" />
        <p class="description">${data.description}</p>
        <div class="denominations" style="display: flex; flex-wrap: wrap; gap: 1rem; margin-top: 1rem;"></div>
      `;

      const denomContainer = container.querySelector(".denominations");
      data.products.forEach((p) => {
        const div = document.createElement("div");
        div.style.border = "1px solid #ccc";
        div.style.borderRadius = "8px";
        div.style.padding = "1rem";
        div.style.flex = "1 0 200px";

        div.innerHTML = `
          <strong>${p.name}</strong><br>
          Nominal: ${p.minFaceValue} ${p.price.currencyCode}<br>
          <span class="price">Price: $${p.price.min.toFixed(2)}</span><br>
          <button>Купити</button>
        `;
        denomContainer.appendChild(div);
      });
    } else {
      // 📦 Головна сторінка категорії (наприклад: /playstation)
      container.innerHTML = `<h1>${brand} — ${data.length} брендів</h1>`;
      data.forEach((brandItem) => {
        const div = document.createElement("div");
        div.style.margin = "2rem 0";
        div.innerHTML = `
          <h2><a href="/${brand}/${brandItem.regionSlug}">${brandItem.name}</a></h2>
          <img src="${brandItem.logoUrl}" alt="${brandItem.name}" style="max-width: 200px; display: block; margin-bottom: 1rem;" />
          <p>${brandItem.description || ""}</p>
        `;
        container.appendChild(div);
      });
    }
  } catch (err) {
    console.error(err);
    container.innerHTML = "<p>Error loading product.</p>";
  }
});



