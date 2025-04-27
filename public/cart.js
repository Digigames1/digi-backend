document.addEventListener("DOMContentLoaded", async () => {
  const cartItemsContainer = document.getElementById("cart-items"); // ✅ правильний ID
  const totalDisplay = document.getElementById("cart-total");        // ✅ правильний ID
  const emptyMsg = document.getElementById("empty-cart-message");    // ✅ правильний ID

  const currencySymbols = {
    USD: "$", EUR: "€", UAH: "₴", PLN: "zł", AUD: "A$", CAD: "C$",
  };
  let rates = { USD: 1 };

  let currentCurrency = localStorage.getItem("currency") || "USD";

  async function loadRates() {
    try {
      const res = await fetch("https://api.exchangerate.host/latest?base=USD&symbols=EUR,UAH,PLN,AUD,CAD");
      const data = await res.json();
      rates = { USD: 1, ...data.rates };
      renderCart();
    } catch (err) {
      console.error("❌ Currency API error:", err);
    }
  }

  function convertPrice(usd, toCurrency) {
    const rate = rates[toCurrency] || 1;
    const symbol = currencySymbols[toCurrency] || "$";
    return `${symbol}${(usd * rate).toFixed(2)}`;
  }

  async function renderCart() {
    try {
      const res = await fetch("/api/cart");
      const cart = await res.json();
      console.log("🛒 Cart loaded:", cart);

      if (!cart.items.length) {
        emptyMsg.style.display = "block";
        cartItemsContainer.innerHTML = "";
        totalDisplay.innerText = "$0.00";
        return;
      }

      cartItemsContainer.innerHTML = "";
      let total = 0;

      cart.items.forEach(item => {
        const div = document.createElement("div");
        div.className = "cart-item";
        div.innerHTML = `
          <img src="${item.image}" alt="${item.name}" class="cart-item-img">
          <div class="cart-item-details">
            <strong>${item.brand}</strong><br>
            ${item.name}<br>
            ${convertPrice(item.price, currentCurrency)} × ${item.quantity}
          </div>
          <button class="remove-btn" data-id="${item._id}">🗑️</button>
        `;
        cartItemsContainer.appendChild(div);

        total += item.price * item.quantity;
      });

      totalDisplay.innerText = convertPrice(total, currentCurrency);

      // Видалення товарів
      document.querySelectorAll(".remove-btn").forEach(btn => {
        btn.addEventListener("click", async (e) => {
          const id = e.target.getAttribute("data-id");
          await fetch(`/remove-from-cart?id=${id}`, { method: "POST" });
          window.location.reload();
        });
      });
    } catch (err) {
      console.error("❌ Load cart error:", err.message);
      if (emptyMsg) emptyMsg.style.display = "block";
      if (cartItemsContainer) cartItemsContainer.innerHTML = "";
      if (totalDisplay) totalDisplay.innerText = "$0.00";
    }
  }

  // Валюта — оновлення
  const currencySelector = document.getElementById("currencySelector");
  if (currencySelector) {
    currencySelector.value = currentCurrency;
    currencySelector.addEventListener("change", async (e) => {
      currentCurrency = e.target.value;
      localStorage.setItem("currency", currentCurrency);
      await loadRates();    // завантажити нові курси
    });
  }

  await loadRates();
});

