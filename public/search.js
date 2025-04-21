document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("searchForm");
  const input = document.getElementById("searchInput");

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const query = input.value.trim().toLowerCase();

      if (query) {
        // ⬅️ Редирект на динамічний бренд-роут
        window.location.href = `/${encodeURIComponent(query)}`;
      }
    });
  }
});



