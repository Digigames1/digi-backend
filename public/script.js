document.addEventListener("DOMContentLoaded", () => {
  // Search handler (if present)
  const searchBtn = document.getElementById("searchBtn");
  if (searchBtn) {
    searchBtn.addEventListener("click", async () => {
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
  }

  // Slider initialization
  const slider = document.querySelector(".hero-slider");
  if (slider) {
    const slides = slider.querySelectorAll(".slide");
    const prev = slider.querySelector(".prev");
    const next = slider.querySelector(".next");
    const dots = slider.querySelectorAll(".dot");
    let index = 0;
    let timer;

    function showSlide(i) {
      slides.forEach((s, idx) => s.classList.toggle("active", idx === i));
      dots.forEach((d, idx) => d.classList.toggle("active", idx === i));
      index = i;
    }

    function nextSlide() {
      showSlide((index + 1) % slides.length);
    }

    function prevSlide() {
      showSlide((index - 1 + slides.length) % slides.length);
    }

    function startAuto() {
      timer = setInterval(nextSlide, 5000);
    }

    function stopAuto() {
      clearInterval(timer);
    }

    next.addEventListener("click", () => {
      stopAuto();
      nextSlide();
      startAuto();
    });

    prev.addEventListener("click", () => {
      stopAuto();
      prevSlide();
      startAuto();
    });

    dots.forEach((dot, i) => {
      dot.addEventListener("click", () => {
        stopAuto();
        showSlide(i);
        startAuto();
      });
    });

    startAuto();
  }
});
