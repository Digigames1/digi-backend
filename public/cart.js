document.addEventListener("DOMContentLoaded", async () => {
  const cartContainer = document.getElementById("cartContainer");
  const totalAmount = document.getElementById("totalAmount");
  const emptyMsg = document.getElementById("emptyMsg");
  const checkoutBtn = document.getElementById("checkoutBtn");

  const currencySymbols = {
    USD: "$", EUR: "€", UAH: "₴", PLN: "zł", AUD: "A$", CAD: "C$"
  };

  let rates = { USD: 1 };
  let currentCurrency = localStorage.getItem("currency") || "USD";
  let cartData = [];

  async function loadRates() {
    try {
      const res = await fetch("https://api.exchangerate.host/latest?base=USD");
      const data = await res.json();
      rates = { USD: 1, ...data.rates };
    } catch (err) {
      console.error("❌ Failed to fetch rates:", err);
    }
  }

  function convertPrice(priceUSD, currency) {
    const rate = rates[currency] || 1;
    const symbol = currencySymbols[currency] || "$";
    const converted = priceUSD * rate;
    return {
      raw: converted,
      formatted: `${symbol}${converted.toFixed(2)}`
    };
  }

  async function loadCart() {
    try {
      const res = await fetch("/get-cart", { credentials: "include" });
      const cart = await res.json();
      cartData = cart;
      renderCart();
    } catch (err) {
      console.error("❌ Failed to load cart:", err);
    }
  }

  function renderCart() {
    cartContainer.innerHTML = "";
    let total = 0;

    if (!cartData || cartData.length === 0) {
      emptyMsg.style.display = "block";
      checkoutBtn.style.display = "none";
      totalAmount.textContent = "$0.00";
      return;
    }

    emptyMsg.style.display = "none";
    checkoutBtn.style.display = "inline-block";

    cartData.forEach(product => {
      const quantity = product.quantity || 1;
      const converted = convertPrice(product.price, currentCurrency);
      const subtotal = converted.raw * quantity;
      total += subtotal;

      const item = document.createElement("div");
      item.className = "category-card card";
      item.innerHTML = `
        <img src="${product.image || "/icons/default.png"}" alt="${product.name}" />
        <div>${product.name}</div>
        <div style="font-size: 0.9rem;">${converted.formatted} × ${quantity}</div>
        <button class="remove-btn" data-id="${product.id}">🗑️</button>
      `;
      cartContainer.appendChild(item);
    });

    totalAmount.textContent = convertPrice(total, currentCurrency).formatted;

    // Обробка видалення
    document.querySelectorAll(".remove-btn").forEach(button => {
      button.addEventListener("click", async (e) => {
        const productId = e.target.dataset.id;
        try {
          await fetch("/remove-from-cart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId }),
            credentials: "include"
          });
          await loadCart();
        } catch (err) {
          alert("❌ Не вдалося видалити товар.");
        }
      });
    });
  }

  // 🎯 Селектор валюти (live)
  const currencySelector = document.getElementById("currencySelector");
  if (currencySelector) {
    currencySelector.value = currentCurrency;
    currencySelector.addEventListener("change", async (e) => {
      currentCurrency = e.target.value;
      localStorage.setItem("currency", currentCurrency);
      await loadRates();
      renderCart(); // 🔁 перерендер без reload
    });
  }

  // 🧾 Checkout
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", () => {
      sessionStorage.setItem("cartTotal", totalAmount.textContent);
      window.location.href = "/checkout.html";
    });
  }

  await loadRates();
  await loadCart();
});


