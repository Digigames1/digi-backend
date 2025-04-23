
document.addEventListener("DOMContentLoaded", async () => {
  const brand = window.location.pathname.split("/")[1];
  const region = window.location.pathname.split("/")[2];

  const productsContainer = document.getElementById("products");
  const brandTitle = document.getElementById("brand-title");

  // 🧼 Видалено модальну логіку
  // 🧼 Видалено: modal, form, inputs

  // 🟩 Валютні курси
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
    await loadRates(); // 🟩 Обов’язково завантажити перед відображенням

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

    // 🔁 Показ підкатегорій
    if (!region) {
      items.forEach(item => {
        const countryCode = item.countryCode?.toLowerCase();
        const regionPath = `${brand}/${countryCode}`;
        const el = document.createElement("div");
        el.innerHTML = `<a href="/${regionPath}" style="display:block; margin: 0.5rem 0; font-weight: bold;">${item.name}</a>`;
        productsContainer.appendChild(el);
      });
      return;
    }

    // 🔁 Вивід товарів
    items.forEach(item => {
      item.products?.forEach(product => {
        const el = document.createElement("div");
        el.className = "product-item";
        el.innerHTML = `
          <div>
            <div class="product-name">${product.name}</div>
            <div class="product-price">${convertPrice(product.price?.min, currentCurrency)}</div>
          </div>
          <button class="buy-btn" data-id="${product.id}" data-price="${product.price?.min}">Buy</button>
        `;
        productsContainer.appendChild(el);
      });
    });

    // 🔁 Додавання до корзини + redirect
    document.querySelectorAll(".buy-btn").forEach(button => {
      button.addEventListener("click", async (e) => {
        const productId = e.target.dataset.id;
        const price = parseFloat(e.target.dataset.price);
        const productName = e.target.parentElement.querySelector(".product-name")?.textContent || "";

        const product = {
          id: productId,
          name: productName,
          price: price,
          image: ""
        };

        try {
          const res = await fetch('/add-to-cart', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ product }),
  credentials: 'include' // 🟩 Це передає cookie сесії
});


          if (!res.ok) throw new Error("Помилка додавання");

          // ✅ Редирект у кошик
          window.location.href = "/cart.html";
        } catch (err) {
          alert("❌ Не вдалося додати до кошика: " + err.message);
        }
      });
    });

  } catch (err) {
    console.error("❌ Load error:", err.message);
    productsContainer.innerHTML = "<p>Помилка завантаження товарів.</p>";
  }

  // 🟩 Безпечне підключення пошуку
  const searchForm = document.getElementById("searchForm");
  if (searchForm) {
    searchForm.addEventListener("submit", function(e) {
      e.preventDefault();
      const query = document.getElementById("headerSearchInput")?.value.trim();
      if (query) {
        window.location.href = `/${encodeURIComponent(query)}`;
      }
    });
  }
});


