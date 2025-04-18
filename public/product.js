document.addEventListener("DOMContentLoaded", async () => {
  const brand = window.location.pathname.split("/")[1];
  const region = window.location.pathname.split("/")[2];

  const productsContainer = document.getElementById("products");
  const brandTitle = document.getElementById("brand-title");

  const modal = document.getElementById("buyModal");
  const orderForm = document.getElementById("orderForm");
  const clientNameInput = document.getElementById("clientName");
  const clientEmailInput = document.getElementById("clientEmail");
  const productIdInput = document.getElementById("selectedProductId");
  const selectedPriceInput = document.getElementById("selectedPrice");

  const isMainBrandPage = !region;

  try {
    const apiUrl = region
      ? `/api/${brand}/${region}`
      : `/api/${brand}`;

    const res = await fetch(apiUrl);
    const data = await res.json();
    console.log("📦 Дані, що прийшли:", data);

    brandTitle.textContent = brand.toUpperCase();

    if (!data || !data.length) {
      productsContainer.innerHTML = "<p>Товари не знайдено.</p>";
      return;
    }

    if (isMainBrandPage) {
      data.forEach(item => {
        const countryCode = item.countryCode?.toLowerCase();
        const regionPath = `${brand}/${countryCode}`;
        const el = document.createElement("div");
        el.innerHTML = `<a href="/${regionPath}" style="display:block; margin: 0.5rem 0; font-weight: bold;">${item.name}</a>`;
        productsContainer.appendChild(el);
      });
      return;
    }

    data.forEach(item => {
      item.products?.forEach(product => {
        const el = document.createElement("div");
        el.className = "product-item";
        el.innerHTML = `
          <div>
            <div class="product-name">${product.name}</div>
            <div class="product-price">$${product.price?.min?.toFixed(2)}</div>
          </div>
          <button class="buy-btn" data-id="${product.id}" data-price="${product.price?.min}">Buy</button>
        `;
        productsContainer.appendChild(el);
      });
    });

    // Відкриття модального вікна
    document.querySelectorAll(".buy-btn").forEach(button => {
      button.addEventListener("click", (e) => {
        const productId = e.target.dataset.id;
        const price = e.target.dataset.price;

        productIdInput.value = productId;
        selectedPriceInput.value = price;

        clientNameInput.value = "";
        clientEmailInput.value = "";
        modal.style.display = "block";
      });
    });

    // Закриття по кліку поза формою
    window.onclick = function (event) {
      if (event.target === modal) {
        modal.style.display = "none";
      }
    };

    // Відправка форми
    orderForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const payload = {
        productId: productIdInput.value,
        email: clientEmailInput.value,
        quantity: 1,
        name: clientNameInput.value,
        price: selectedPriceInput.value
      };

      try {
        const res = await fetch("/api/order", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        const result = await res.json();

        if (res.ok) {
          alert("Замовлення успішно створено!");
          modal.style.display = "none";
        } else {
          alert("Помилка: " + result.error || "Спробуйте ще раз");
        }
      } catch (err) {
        alert("Помилка: " + err.message);
      }
    });

  } catch (err) {
    console.error("❌ Load error:", err.message);
    productsContainer.innerHTML = "<p>Помилка завантаження товарів.</p>";
  }
});




