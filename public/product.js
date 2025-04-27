document.addEventListener("DOMContentLoaded", async () => {
  const brand = window.location.pathname.split("/")[1];
  const region = window.location.pathname.split("/")[2];
  const productsContainer = document.getElementById("products");
  const brandTitle = document.getElementById("brand-title");

  const currencySymbols = {
    USD: "$", EUR: "€", UAH: "₴", PLN: "zł", AUD: "A$", CAD: "C$",
  };

  let rates = { USD: 1 };
  let currentCurrency = localStorage.getItem("currency") || "USD";

  // Завантаження курсів валют
  async function loadRates() {
    try {
      const res = await fetch("https://api.exchangerate.host/latest?base=USD&symbols=EUR,UAH,PLN,AUD,CAD");
      const data = await res.json();
      rates = { USD: 1, ...data.rates };
      console.log("Курси валют завантажено:", rates);
      renderPrices();
    } catch (err) {
      console.error("Currency rates loading error:", err);
    }
  }

  function convertPrice(usd, toCurrency) {
    const rate = rates[toCurrency] || 1;
    const symbol = currencySymbols[toCurrency] || "$";
    return `${symbol}${(usd * rate).toFixed(2)}`;
  }

  function renderPrices() {
    document.querySelectorAll("[data-usd-price]").forEach(el => {
      const usd = parseFloat(el.getAttribute("data-usd-price"));
      if (!isNaN(usd)) {
        el.innerText = convertPrice(usd, currentCurrency);
      }
    });
  }

  // Слухач на зміну валюти
  const currencySelector = document.getElementById("currencySelector");
  if (currencySelector) {
    currencySelector.value = currentCurrency;

    currencySelector.addEventListener("change", (e) => {
      currentCurrency = e.target.value;
      localStorage.setItem("currency", currentCurrency);
      renderPrices();
    });
  }

  // Завантаження продуктів
  async function loadProducts() {
    try {
      const res = await fetch(`/api/products/${brand}/${region}`);
      const data = await res.json();

      brandTitle.innerText = brand.toUpperCase();
      productsContainer.innerHTML = "";

      data.items.forEach(item => {
        const card = document.createElement("div");
        card.className = "product-card";
        card.innerHTML = `
          <h3>${item.title}</h3>
          <p data-usd-price="${item.price_usd}">$${item.price_usd}</p>
          <button onclick="addToCart('${brand}', '${region}', '${item.title}', ${item.price_usd})">Buy</button>
        `;
        productsContainer.appendChild(card);
      });

      renderPrices(); // 🔥 Оновити ціни після виводу продуктів
    } catch (err) {
      console.error("Помилка завантаження товарів:", err);
      productsContainer.innerHTML = "<p>Помилка завантаження товарів.</p>";
    }
  }

  await loadRates();
  await loadProducts();
});

// Додавання товару у корзину
function addToCart(brand, region, title, price) {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  cart.push({ brand, region, title, price });
  localStorage.setItem("cart", JSON.stringify(cart));
  alert("Product added to cart!");
}

