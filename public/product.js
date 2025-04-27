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
  let flatProducts = [];

  async function loadRates() {
    try {
      const res = await fetch("https://api.exchangerate.host/latest?base=USD&symbols=EUR,UAH,PLN,AUD,CAD");
      const data = await res.json();
      rates = { USD: 1, ...data.rates };
    } catch (err) {
      console.error("❌ Currency API error:", err);
    }
  }

  function convertPrice(usd, toCurrency) {
    const rate = rates[toCurrency] || 1;
    const symbol = currencySymbols[toCurrency] || "$";
    return `${symbol}${(usd * rate).toFixed(2)}`;
  }

  function renderProducts() {
    productsContainer.innerHTML = "";

    flatProducts.forEach(product => {
      const el = document.createElement("div");
      el.className = "product-item";
      el.innerHTML = `
        <div>
          <div class="product-name">${product.name}</div>
          <div class="product-price" data-usd-price="${product.price}">${convertPrice(product.price, currentCurrency)}</div>
        </div>
        <button class="buy-btn" data-id="${product.id}" data-price="${product.price}">Buy</button>
      `;
      productsContainer.appendChild(el);
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
          image: ""
        };

        try {
          const res = await fetch('/add-to-cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product }),
            credentials: 'include'
          });

          if (!res.ok) throw new Error("Помилка додавання");
          window.location.href = "/cart.html";
        } catch (err) {
          alert("❌ Не вдалося додати до кошика: " + err.message);
        }
      });
    });
  }

  function updatePrices() {
    document.querySelectorAll(".product-price[data-usd-price]").forEach(el => {
      const usd = parseFloat(el.getAttribute("data-usd-price"));
      if (!isNaN(usd)) {
        el.innerText = convertPrice(usd, currentCurrency);
      }
    });
  }

  async function loadProducts() {
    try {
      const apiUrl = region ? `/api/${brand}/${region}` : `/api/${brand}`;
      const res = await fetch(apiUrl);
      const data = await res.json();

      brandTitle.textContent = brand.toUpperCase();
      const items = data?.items || [];

      if (!items.length) {
        productsContainer.innerHTML = "<p>Товари не знайдено.</p>";
        return;
      }

      if (!region) {
        items.forEach(item => {
          const regionPath = `${brand}/${item.countryCode?.toLowerCase()}`;
          const el = document.createElement("div");
          el.innerHTML = `<a href="/${regionPath}" style="display:block; margin: 0.5rem 0; font-weight: bold;">${item.name}</a>`;
          productsContainer.appendChild(el);
        });
        return;
      }

      flatProducts = []; // очистити перед завантаженням
      items.forEach(item => {
        item.products?.forEach(product => {
          flatProducts.push({
            id: product.id,
            name: product.name,
            price: product.price?.min || 0,
            image: ""
          });
        });
      });

      renderProducts();
    } catch (err) {
      console.error("❌ Load error:", err.message);
      productsContainer.innerHTML = "<p>Помилка завантаження товарів.</p>";
    }
  }

  // 🔍 Пошук
  document.getElementById("searchForm")?.addEventListener("submit", function(e) {
    e.preventDefault();
    const query = document.getElementById("headerSearchInput")?.value.trim();
    if (query) {
      window.location.href = `/${encodeURIComponent(query)}`;
    }
  });

  // 💱 Селектор валюти
  const currencySelect = document.getElementById("currencySelector");
  if (currencySelect) {
    currencySelect.value = currentCurrency;
    currencySelect.addEventListener("change", async (e) => {
      currentCurrency = e.target.value;
      localStorage.setItem("currency", currentCurrency);
      await loadRates();   // оновити курси
      updatePrices();      // перерахувати ціни без reload
    });
  }

  await loadRates();    // завантажити курси валют
  await loadProducts(); // завантажити товари
});


