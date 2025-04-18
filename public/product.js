document.addEventListener("DOMContentLoaded", async () => {
  const pathParts = window.location.pathname.split("/");
  const productSlug = pathParts[pathParts.length - 1].toLowerCase();

  const nameElement = document.getElementById("product-name");
  const priceElement = document.getElementById("product-price");
  const descriptionElement = document.getElementById("product-description");
  const logoElement = document.getElementById("product-logo");

  try {
    const res = await fetch("/api/bamboo");
    const data = await res.json();

    if (!data.items || data.items.length === 0) {
      nameElement.textContent = "No products found.";
      return;
    }

    const product = data.items.find(p => 
      p.name.toLowerCase().includes(productSlug)
    );

    if (!product) {
      nameElement.textContent = "Product not found.";
      return;
    }

    nameElement.textContent = product.name;
    descriptionElement.textContent = product.description || "No description provided.";
    
    if (product.products?.[0]?.price?.min) {
      priceElement.textContent = `Price: $${product.products[0].price.min}`;
    }

    if (product.logoUrl) {
      logoElement.src = product.logoUrl;
      logoElement.style.display = "block";
    }

  } catch (err) {
    nameElement.textContent = "Error loading product.";
    console.error("❌ Product page error:", err);
  }
});
