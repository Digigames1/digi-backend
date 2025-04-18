document.addEventListener("DOMContentLoaded", async () => {
  const pathParts = window.location.pathname.split("/");
  const productSlug = pathParts[pathParts.length - 1].toLowerCase();

  const nameElement = document.getElementById("product-name");
  const productList = document.getElementById("product-variants");
  const descriptionElement = document.getElementById("product-description");
  const logoElement = document.getElementById("product-logo");
  const buySection = document.getElementById("buy-section");

  try {
    const res = await fetch("/api/bamboo");
    const data = await res.json();

    const product = data.items.find(p =>
      p.name.toLowerCase().includes(productSlug)
    );

    if (!product) {
      nameElement.textContent = "Product not found.";
      return;
    }

    nameElement.textContent = product.name;
    descriptionElement.textContent = product.description || "No description.";
    
    if (product.logoUrl) {
      logoElement.src = product.logoUrl;
      logoElement.style.display = "block";
    }

    if (product.products?.length > 0) {
      // Створюємо селектор
      const select = document.createElement("select");
      select.id = "variant-select";

      product.products.forEach((variant, index) => {
        const option = document.createElement("option");
        option.value = index;
        option.textContent = `$${variant.minFaceValue} — $${variant.price.min}`;
        select.appendChild(option);
      });

      productList.appendChild(select);

      // Додаємо кнопку Купити
      const btn = document.createElement("button");
      btn.textContent = "🛒 Купити";
      btn.style.marginTop = "10px";
      btn.onclick = () => {
        const selected = product.products[select.value];
        console.log("🛍 Обраний товар:", selected);
        alert(`Ти обрав: ${product.name} на $${selected.minFaceValue} за $${selected.price.min}`);
      };

      buySection.appendChild(btn);
    }

  } catch (err) {
    nameElement.textContent = "Error loading product.";
    console.error("❌ Product page error:", err);
  }
});
