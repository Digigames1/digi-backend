document.addEventListener("DOMContentLoaded", async () => {
  const cartItemsContainer = document.getElementById("cart-items");
  const totalDisplay = document.getElementById("cart-total");
  const emptyMsg = document.getElementById("empty-cart-message");

  const currencySymbols = {
    USD: "$", EUR: "€", UAH: "₴", PLN: "zł", AUD: "A$", CAD: "C$",
  };

  let rates = { USD: 1 };
  let currentCurrency = localStorage.getItem("currency") || "USD";

  async function loadRates() {
    try {
      const res = await fetch("https://api.frankfurter.app/latest?from=USD&to=EUR,UAH,PLN,AUD,CAD");
      const data = await res.json();

      if (!data.rates) throw new Error("❌ Курси не знайдено");
      rates = { USD: 1, ...data.rates };
      console.log("✅ Курси з Frankfurter:", rates);
    } catch (err) {
      console.error("❌ Помилка отримання курсів:", err);
      rates = { USD: 1 };
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
      console.log("🛒 Отримано кошик:", cart);

      if (!cart.items.length) {
        emptyMsg.style.display = "block";
        totalDisplay.innerText = "$0.00";
        cartItemsContainer.innerHTML = "";
        return;
      }

      cartItemsContainer.innerHTML = "";
      let total = 0;

      cart.items.forEach(item => {
        const price = typeof item.price === "number" ? item.price : 0;
        const quantity = typeof item.quantity === "number" ? item.quantity : 1;

        const div = document.createElement("div");
        div.className = "cart-item";
        div.innerHTML = `
          <img src="${item.image || '/default-image.png'}" alt="${item.name || 'No Name'}" class="cart-item-img">
          <div class="cart-item-details">
            <strong>${item.brand || ''}</strong><br>
            ${item.name || 'Unnamed Product'}<br>
            ${convertPrice(price, currentCurrency)} × ${quantity}
          </div>
          <button class="remove-btn" data-id="${item._id}">🗑️</button>
        `;
        cartItemsContainer.appendChild(div);

        total += price * quantity;
      });

      totalDisplay.innerText = convertPrice(total, currentCurrency);

      document.querySelectorAll(".remove-btn").forEach(btn => {
        btn.addEventListener("click", async (e) => {
          const id = e.target.getAttribute("data-id");
          if (id) {
            await fetch(`/remove-from-cart?id=${id}`, { method: "POST" });
            window.location.reload();
          }
        });
      });
    } catch (err) {
      console.error("❌ Помилка відображення кошика:", err.message);
      if (emptyMsg) emptyMsg.style.display = "block";
      if (cartItemsContainer) cartItemsContainer.innerHTML = "";
      if (totalDisplay) totalDisplay.innerText = "$0.00";
    }
  }

  const currencySelector = document.getElementById("currencySelector");
  if (currencySelector) {
    currencySelector.value = currentCurrency;
    currencySelector.addEventListener("change", async (e) => {
      currentCurrency = e.target.value;
      localStorage.setItem("currency", currentCurrency);
      await loadRates();
      renderCart();
    });
  }

  await loadRates();
  await renderCart();
});
