
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

  // 🟩 🆕 Валюти
  const currencySymbols = {
    USD: "$",
    EUR: "€",
    UAH: "₴",
    PLN: "zł",
    AUD: "A$",
    CAD: "C$",
  };

  let rates = { USD: 1 };

  const currentCurrency = localStorage.getItem("currency") || "USD";

  function convertPrice(usd, toCurrency) {
    const rate = rates[toCurrency] || 1;
    const symbol = currencySymbols[toCurrency] || "$";
    return `${symbol}${(usd * rate).toFixed(2)}`;
  }

  async function loadRates() {
    try {
      const res = await fetch("https://api.exchangerate.host/latest?base=USD&symbols=EUR,UAH,PLN,AUD,CAD");
      const data = await res.json();
      rates = { USD: 1, ...data.rates };
    } catch (err) {
      console.error("❌ Currency API error:", err);
    }
  }

  try {
    await loadRates(); // 🟨 🔁 Спочатку завантажити курси

    const apiUrl = region ? `/api/${brand}/${region}` : `/api/${brand}`;
    const res = await fetch(apiUrl);
    const data = await res.json();
    console.log("📦 Дані, що прийшли:", data);

    brandTitle.textContent = brand.toUpperCase();

    const items = data?.items || [];

    if (!items.length) {
      productsContainer.innerHTML = "<p>Товари не знайдено.</p>";
      return;
    }

    if (isMainBrandPage) {
      items.forEach(item => {
        const countryCode = item.countryCode?.toLowerCase();
        const regionPath = `${brand}/${countryCode}`;
        const el = document.createElement("div");
        el.innerHTML = `<a href="/${regionPath}" style="display:block; margin: 0.5rem 0; font-weight: bold;">${item.name}</a>`;
        productsContainer.appendChild(el);
      });
      return;
    }

    items.forEach(item => {
      item.products?.forEach(product => {
        const el = document.createElement("div");
        el.className = "product-item";
        el.innerHTML = `
          <div>
            <div class="product-name">${product.name}</div>
            <div class="product-price">${convertPrice(product.price?.min, currentCurrency)}</div> <!-- 🟨 🔁 -->
          </div>
          <button class="buy-btn" data-id="${product.id}" data-price="${product.price?.min}">Buy</button>
        `;
        productsContainer.appendChild(el);
      });
    });

    document.querySelectorAll(".buy-btn").forEach(button => {
  button.addEventListener("click", async (e) => {
    const productId = e.target.dataset.id;
    const price = parseFloat(e.target.dataset.price);
    const productName = e.target.parentElement.querySelector(".product-name")?.textContent || "";

    const product = {
      id: productId,
      name: productName,
      price: price,
      image: "" // якщо є — додай
    };

    try {
      const res = await fetch('/add-to-cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product })
      });

      if (!res.ok) throw new Error("Помилка додавання");

      // ✅ Успішно — перенаправляємо на cart
      window.location.href = "/cart.html";
    } catch (err) {
      alert("❌ Не вдалося додати до кошика: " + err.message);
    }
  });
});


    // Закриття модалки
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
          alert("Помилка: " + (result.error || "Спробуйте ще раз"));
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

