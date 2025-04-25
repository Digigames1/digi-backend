document.addEventListener("DOMContentLoaded", async () => {
  const cartItemsContainer = document.getElementById("cart-items");
  const emptyMsg = document.getElementById("empty-cart-message");
  const checkoutBtn = document.getElementById("checkout-button");
  const totalDisplay = document.getElementById("cart-total");

  const currentCurrency = localStorage.getItem("currency") || "USD";

  const currencySymbols = {
    USD: "$",
    EUR: "€",
    UAH: "₴",
    PLN: "zł",
    AUD: "A$",
    CAD: "C$",
  };

  let rates = { USD: 1 };

  // 📥 Завантаження курсів валют
  async function loadRates() {
    try {
      const res = await fetch("https://api.exchangerate.host/latest?base=USD&symbols=EUR,UAH,PLN,AUD,CAD");
      const data = await res.json();
      rates = { USD: 1, ...data.rates };
    } catch (err) {
      console.error("❌ Currency API error:", err);
    }
  }

  // 💱 Конвертація
  function convertPrice(usd, toCurrency) {
    const rate = rates[toCurrency] || 1;
    const symbol = currencySymbols[toCurrency] || "$";
    const converted = usd * rate;
    return {
      amount: converted,
      formatted: `${symbol}${converted.toFixed(2)}`
    };
  }

  // 🛒 Рендеринг корзини
  async function renderCart() {
    cartItemsContainer.innerHTML = "";
    let total = 0;

    const response = await fetch("/get-cart", { credentials: 'include' });
    const cart = await response.json();

    if (!cart || cart.length === 0) {
      if (emptyMsg) emptyMsg.style.display = "block";
      if (checkoutBtn) checkoutBtn.style.display = "none";
      if (totalDisplay) totalDisplay.innerText = convertPrice(0, currentCurrency).formatted;
      return;
    }

    if (emptyMsg) emptyMsg.style.display = "none";

    for (const item of cart) {
      const priceUSD = parseFloat(item.price || 0);
      const converted = convertPrice(priceUSD, currentCurrency);
      const quantity = item.quantity || 1;
      const totalItem = converted.amount * quantity;
      total += totalItem;

      const el = document.createElement("div");
      el.className = "category-card card";
      el.innerHTML = `
        <img src="${item.image || '/icons/default.png'}" alt="${item.name}" />
        <div>${item.name}</div>
        <div style="font-size: 0.9rem;">${converted.formatted} × ${quantity}</div>
        <button class="remove-btn" data-id="${item.id}">🗑️</button>
      `;
      cartItemsContainer.appendChild(el);
    }

    if (totalDisplay) {
      totalDisplay.innerText = convertPrice(total, currentCurrency).formatted;
    }

    // 🧹 Видалення
    document.querySelectorAll(".remove-btn").forEach(button => {
      button.addEventListener("click", async (e) => {
        const productId = e.target.dataset.id;
        try {
          await fetch("/remove-from-cart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId }),
            credentials: 'include'
          });
          renderCart(); // 🔁 оновити корзину після видалення
        } catch (err) {
          alert("❌ Помилка при видаленні товару");
        }
      });
    });
  }

  await loadRates();
  await renderCart();

  // 💳 Перехід на checkout
  if (checkoutBtn) {
    checkoutBtn.style.display = "inline-block";

    checkoutBtn.addEventListener("click", async () => {
      const total = totalDisplay.innerText;
      if (!total || total.includes("$0") || total.includes("₴0")) return;

      sessionStorage.setItem("cartTotal", total);
      window.location.href = "/checkout.html";
    });
  }
});


