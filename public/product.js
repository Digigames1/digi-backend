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

  try {
    const apiUrl = region ? `/api/${brand}/${region}` : `/api/${brand}`;
    const res = await fetch(apiUrl);
    const data = await res.json();

    if (!data || !data.length) {
      productsContainer.innerHTML = "<p>Товари не знайдено.</p>";
      return;
    }

    brandTitle.textContent = `${brand.toUpperCase()} ${region?.toUpperCase() || ""}`;

    const grouped = {};
    data.forEach(item => {
      item.products?.forEach(product => {
        const groupKey = item.countryCode || "Other";
        if (!grouped[groupKey]) grouped[groupKey] = [];
        grouped[groupKey].push({ ...product, logoUrl: item.logoUrl });
      });
    });

    for (const regionCode in grouped) {
      const regionDiv = document.createElement("div");
      regionDiv.className = "region-group";
      regionDiv.innerHTML = `<h3>${regionCode}</h3>`;

      grouped[regionCode].forEach(product => {
        const el = document.createElement("div");
        el.className = "product-item";
        el.innerHTML = `
          <div>
            <img src="${product.logoUrl}" alt="" class="product-logo" />
            <div class="product-name">${product.name}</div>
            <div class="product-price">$${product.price?.min.toFixed(2)}</div>
          </div>
          <button class="buy-btn" data-id="${product.id}" data-price="${product.price?.min}">Buy</button>
        `;
        regionDiv.appendChild(el);
      });

      productsContainer.appendChild(regionDiv);
    }

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

        if (res.ok) {
          window.location.href = "/order-success.html"; // ✅ Переадресація
        } else {
          const result = await res.json();
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



