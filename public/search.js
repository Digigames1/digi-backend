document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const query = urlParams.get("query");

  const searchResults = document.getElementById("searchResults");
  const noResults = document.getElementById("noResults");

  if (!query) {
    noResults.textContent = "Please enter a search query.";
    noResults.style.display = "block";
    return;
  }

  console.log("🔍 Sending query to backend:", query); // <== новий лог

  try {
    const res = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
    const data = await res.json();

    console.log("📦 Received search data:", data); // <== новий лог

    if (!data.items || data.items.length === 0) {
      noResults.style.display = "block";
      return;
    }

    data.items.forEach(item => {
      const brandName = item.name;
      const logo = item.logoUrl;
      const products = item.products || [];

      products.forEach(product => {
        const card = document.createElement("div");
        card.className = "category-card";
        card.innerHTML = `
          <img src="${logo}" alt="${brandName}" />
          <div>${product.name}</div>
          <div style="font-size: 0.9rem; color: #333;">from $${product?.price?.min?.toFixed(2) || "N/A"}</div>
        `;
        searchResults.appendChild(card);
      });
    });

  } catch (err) {
    console.error("❌ Search load error:", err.message);
    noResults.textContent = "Failed to load search results.";
    noResults.style.display = "block";
  }
});


