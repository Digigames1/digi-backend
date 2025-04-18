document.addEventListener("DOMContentLoaded", async () => {
  const path = window.location.pathname;
  const productSlug = path.split("/")[1]; // напр. 'steam' з '/steam'

  try {
    const res = await fetch(`/api/bamboo?name=${productSlug}`);
    const data = await res.json();

    const item = data.items[0];

    document.getElementById("product-name").textContent = item.name || productSlug;
    document.getElementById("product-description").textContent = item.description || "No description";
    document.getElementById("product-image").src = item.logoUrl || "";
    document.getElementById("product-price").textContent = item.products[0].price.min || "N/A";
  } catch (err) {
    document.getElementById("product-name").textContent = "Product not found";
    console.error("Failed to load product:", err);
  }
});
