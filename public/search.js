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

  try {
    const res = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
    const data = await res.json();

    if (!data.items || data.items.length === 0) {
      noResults.style.display = "block";
      return;
    }

    data.items.forEach(item => {
      const logo = item.logoUrl;
      const title = item.name;
      const product = item.products?.[0];
      const price = product?.price?.min?.toFixed(2) || "N/A";

      const card = document.createElement("div");
      card.className = "category-card";
      card.innerHTML = `
        <img src="${logo}" alt="${title}" />
        <div>${title}</div>
        <div style="font-size: 0.9rem; color: #333;">from $${price}</div>
      `;
      searchResults.appendChild(card);
    });
  } catch (err) {
    noResults.textContent = "Failed to load search results.";
    noResults.style.display = "block";
    console.error("❌ Search load error:", err.message);
  }
});
