document.addEventListener("DOMContentLoaded", async () => {
  const path = window.location.pathname;
  const parts = path.split("/").filter(Boolean);
  const brand = parts[0];
  const region = parts[1];

  const nameEl = document.getElementById("product-name");
  const logoEl = document.getElementById("product-logo");
  const descEl = document.getElementById("product-description");
  const priceEl = document.getElementById("product-price");
  const variantsEl = document.getElementById("product-variants");

  try {
    const response = await fetch(`/${brand}${region ? "/" + region : ""}`);
    const data = await response.json();

    nameEl.innerText = brand.toUpperCase();

    if (data.mode === "categories") {
      // Виводимо підкатегорії
      variantsEl.innerHTML = data.categories.map(cat => `
        <div class="variant">
          <img src="${cat.logoUrl}" alt="${cat.brandName}" class="variant-logo"/>
          <h3>${cat.brandName}</h3>
          <a href="/${brand}/${cat.countryCode.toLowerCase()}">Переглянути</a>
        </div>
      `).join("");
    } else {
      // Виводимо товари
      logoEl.src = data.logoUrl;
      logoEl.style.display = "block";
      descEl.innerText = data.description;

      variantsEl.innerHTML = data.products.map(p => `
        <div class="variant">
          <h3>${data.name}</h3>
          <p>Nominal: ${p.minFaceValue} ${data.currencyCode}</p>
          <p class="price">Price: $${p.price?.min?.toFixed(2)}</p>
          <button>Купити</button>
        </div>
      `).join("");
    }
  } catch (err) {
    nameEl.innerText = "Error loading product.";
    console.error("❌", err.message);
  }
});



