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
      const logo = item.logoUrl || "/icons/default.svg";
      const brandName = item.name;

      const groupDiv = document.createElement("div");
      groupDiv.className = "category-card";
      groupDiv.innerHTML = `
        <img src="${logo}" alt="${brandName}" />
        <div>${brandName}</div>
      `;

      if (item.products?.length) {
        const productsList = document.createElement("ul");
        productsList.style.listStyle = "none";
        productsList.style.padding = "0";
        productsList.style.marginTop = "0.5rem";

        item.products.forEach(prod => {
          const price = prod?.price?.min?.toFixed(2) || "N/A";
          const li = document.createElement("li");
          li.textContent = `${prod.name} - $${price}`;
          productsList.appendChild(li);
        });

        groupDiv.appendChild(productsList);
      }

      searchResults.appendChild(groupDiv);
    });
  } catch (err) {
    noResults.textContent = "Failed to load search results.";
    noResults.style.display = "block";
    console.error("❌ Search load error:", err.message);
  }
});

