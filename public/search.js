document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const query = urlParams.get("query");

  const resultsContainer = document.getElementById("search-results");
  const searchTitle = document.getElementById("search-title");

  if (!query) {
    resultsContainer.innerHTML = "<p>❗ Введіть пошуковий запит</p>";
    return;
  }

  searchTitle.textContent = `Результати для: "${query}"`;

  try {
    const res = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
    const data = await res.json();

    if (!data.items || !data.items.length) {
      resultsContainer.innerHTML = "<p>❌ Нічого не знайдено.</p>";
      return;
    }

    data.items.forEach(item => {
      const card = document.createElement("div");
      card.className = "category-card";
      card.innerHTML = `
        <img src="${item.logoUrl || '/icons/placeholder.png'}" alt="${item.name}" />
        <div>${item.name}</div>
      `;
      resultsContainer.appendChild(card);
    });
  } catch (err) {
    console.error("❌ Search load error:", err.message);
    resultsContainer.innerHTML = "<p>⚠️ Помилка завантаження результатів.</p>";
  }
});
