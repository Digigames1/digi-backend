document.addEventListener("DOMContentLoaded", async () => {
  const [_, brand, region] = window.location.pathname.split("/");

  const productsContainer = document.getElementById("products");
  const brandTitle = document.getElementById("brand-title");

  try {
    const apiUrl = region ? `/api/${brand}/${region}` : `/api/${brand}`;
    const res = await fetch(apiUrl);
    const data = await res.json();

    if (!data || !data.items || data.items.length === 0) {
      productsContainer.innerHTML = "<p>Товари не знайдено.</p>";
      return;
    }

    brandTitle.textContent = brand.toUpperCase();

    if (!region) {
      // 🎯 Режим списку підкатегорій
      const uniqueRegions = new Set();

      data.items.forEach(item => {
        const regionName = item.countryCode.toLowerCase();
        if (!uniqueRegions.has(regionName)) {
          uniqueRegions.add(regionName);

          const el = document.createElement("div");
          el.innerHTML = `<a href="/${brand}/${regionName}" style="display:block; font-size:1.2rem; margin:0.5rem 0;">${item.name}</a>`;
          productsContainer.appendChild(el);
        }
      });

    } else {
      // 🎯 Режим показу конкретних товарів
      data.items.forEach(item => {
        if (!item.products) return;

        item.products.forEach(product => {
          const el = document.createElement("div");
          el.className = "product-item";
          el.innerHTML = `
            <div>
              <div class="product-name">${product.name}</div>
              <div class="product-price">$${product.price?.min?.toFixed(2) || "N/A"}</div>
            </div>
            <button class="buy-btn" data-id="${product.id}" data-price="${product.price?.min}">Buy</button>
          `;
          productsContainer.appendChild(el);
        });
      });

      // 🎯 Модальне оформлення замовлення
      const modal = document.getElementById("buyModal");
      const orderForm = document.getElementById("orderForm");
      const successMessage = document.getElementById("successMessage");

      const clientNameInput = document.getElementById("clientName");
      const clientEmailInput = document.getElementById("clientEmail");
      const productIdInput = document.getElementById("selectedProductId");
      const selectedPriceInput = document.getElementById("selectedPrice");

      document.querySelectorAll(".buy-btn").forEach(button => {
        button.addEventListener("click", (e) => {
          const productId = e.target.dataset.id;
          const price = e.target.dataset.price;

          productIdInput.value = productId;
          selectedPriceInput.value = price;

          clientNameInput.value = "";
          clientEmailInput.value = "";
          successMessage.style.display = "none";

          modal.style.display = "block";
        });
      });

      window.onclick = function (event) {
        if (event.target === modal) {
          modal.style.display = "none";
        }
      };

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
            successMessage.style.display = "block";
          } else {
            alert("❌ Помилка: " + (result.error || "Спробуйте ще раз"));
          }
        } catch (err) {
          alert("❌ Помилка: " + err.message);
        }
      });
    }
  } catch (err) {
    console.error("❌ Load error:", err.message);
    productsContainer.innerHTML = "<p>Помилка завантаження товарів.</p>";
  }
});


