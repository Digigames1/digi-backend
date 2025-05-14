document.addEventListener("DOMContentLoaded", async () => {
  const brand = window.location.pathname.split("/")[1];
  const region = window.location.pathname.split("/")[2];

  const productsContainer = document.getElementById("products");
  const brandTitle = document.getElementById("brand-title");

  const currencySymbols = {
    USD: "$", EUR: "€", UAH: "₴", PLN: "zł", AUD: "A$", CAD: "C$",
  };

  let rates = { USD: 1 };
  let flatProducts = [];
  let currentCurrency = localStorage.getItem("currency") || "USD";
  let debounceTimer = null;

  async function loadRates() {
    try {
      const res = await fetch("https://api.frankfurter.app/latest?from=USD&to=EUR,UAH,PLN,AUD,CAD");
      const data = await res.json();
      if (!data.rates) throw new Error("Курси не знайдено у відповіді");
      rates = { USD: 1, ...data.rates };
      if (!rates.UAH) {
        rates.UAH = 39; // fallback курс
      }
      console.log("💱 Курси:", rates);
    } catch (err) {
      console.error("Помилка завантаження курсів:", err);
      rates = { USD: 1, UAH: 39 }; // повний fallback
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
          <div class="product-price" data-usd-price="${product.price}"></div>
        </div>
        <button class="buy-btn" data-product='${JSON.stringify(product)}'>Buy</button>
      `;
      productsContainer.appendChild(el);
    });
    attachBuyHandlers();
    updatePrices();
  }

  function updatePrices() {
    document.querySelectorAll(".product-price[data-usd-price]").forEach(el => {
      const usd = parseFloat(el.getAttribute("data-usd-price"));
      if (!isNaN(usd)) {
        el.innerText = convertPrice(usd, currentCurrency);
      }
    });
  }

  function attachBuyHandlers() {
    document.querySelectorAll(".buy-btn").forEach(button => {
      button.addEventListener("click", async (e) => {
        const raw = e.target.dataset.product;
        if (!raw) return alert("Товар не знайдено");

        const baseProduct = JSON.parse(raw);
        const product = {
          ...baseProduct,
          quantity: 1,
          currencyCode: currentCurrency,
          price: Number(baseProduct.price) || 0,
          addedAt: Date.now(),
          image: baseProduct.image || "/default-image.png",
          _id: `${baseProduct.id}-${Date.now()}`
        };

        try {
          const res = await fetch("/add-to-cart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ product }),
            credentials: "include"
          });
          if (!res.ok) throw new Error("Помилка додавання");
          window.location.href = "/cart.html";
        } catch (err) {
          alert("Не вдалося додати товар: " + err.message);
        }
      });
    });
  }

  async function loadProducts() {
    try {
      const apiUrl = region ? `/api/${brand}/${region}` : `/api/${brand}`;
      const res = await fetch(apiUrl);
      if (res.status === 429) {
        productsContainer.innerHTML = "<p>⏳ Забагато запитів. Спробуйте пізніше.</p>";
        return;
      }

      const data = await res.json();
      brandTitle.textContent = brand.toUpperCase();
      const items = data?.items || [];

      if (!region) {
        items.forEach(item => {
          const link = `${brand}/${item.countryCode?.toLowerCase()}`;
          productsContainer.innerHTML += `<a href="/${link}">${item.name}</a><br>`;
        });
        return;
      }

      flatProducts = [];
      items.forEach(item => {
        item.products?.forEach(product => {
          flatProducts.push({
            id: product.id,
            name: product.name,
            price: product.price?.min || 0,
            image: product.image || "/default-image.png",
            addedAt: Date.now()
          });
        });
      });

      renderProducts();
    } catch (err) {
      console.error("Помилка завантаження:", err.message);
      productsContainer.innerHTML = "<p>Помилка при завантаженні товарів.</p>";
    }
  }

  const currencySelect = document.getElementById("currencySelector");
  if (currencySelect) {
    currencySelect.value = currentCurrency;
    currencySelect.addEventListener("change", (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        currentCurrency = e.target.value;
        localStorage.setItem("currency", currentCurrency);
        await loadRates();
        await loadProducts();
        updatePrices();
      }, 400);
    });
  }

  await loadRates();
  await loadProducts();
  updatePrices();
});



