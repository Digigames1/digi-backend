document.addEventListener("DOMContentLoaded", () => {
  const searchForm = document.getElementById("searchForm");
  const searchInput = document.getElementById("searchInput");

  if (searchForm) {
    searchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const query = searchInput.value.trim().toLowerCase();

      if (query) {
        // 🔁 Замість API — редирект на динамічну сторінку
        window.location.href = `/${encodeURIComponent(query)}`;
      }
    });
  }
});



