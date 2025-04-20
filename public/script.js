document.getElementById("searchBtn").addEventListener("click", async () => {
  const query = document.getElementById("searchInput").value.trim();
  if (!query) return;

  const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
  const data = await res.json();

  const container = document.getElementById("searchResults");
  container.innerHTML = "";

  if (!data?.items?.length) {
    container.innerHTML = "<p>No products found.</p>";
    return;
  }

  data.items.forEach(item => {
    item.products?.forEach(product => {
      const card = document.createElement("div");
      card.className = "category-card";
      card.innerHTML = `
        <img src="${item.logoUrl}" alt="${item.name}" />
        <div>${product.name}</div>
        <div>$${product.price?.min?.toFixed(2)}</div>
      `;
      container.appendChild(card);
    });
  });
});
