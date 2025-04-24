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
    return {
      amount: usd * rate,
      formatted: `${symbol}${(usd * rate).toFixed(2)}`
    };
  }

  let total = 0;

  try {
    await loadRates(); // 🔁 Спочатку завантажити курси

    const response = await fetch("/get-cart", { credentials: 'include' });
    const cart = await response.json();

    if (!cart || cart.length === 0) {
      if (emptyMsg) emptyMsg.style.display = "block";
      if (checkoutBtn) checkoutBtn.style.display = "none";
      if (totalDisplay) totalDisplay.innerText = convertPrice(0, currentCurrency).formatted;
      return;
    }

    if (emptyMsg) emptyMsg.style.display = "none";

    cart.forEach((item) => {
      const priceUSD = parseFloat(item.price || 0);
      const converted = convertPrice(priceUSD, currentCurrency);
      total += converted.amount;

      const el = document.createElement("div");
      el.className = "category-card card";
      el.innerHTML = `
        <img src="${item.image || '/icons/default.png'}" alt="${item.name}" />
        <div>${item.name}</div>
        <div style="font-size: 0.9rem;">${converted.formatted}</div>
      `;
      cartItemsContainer.appendChild(el);
    });

    if (totalDisplay) {
      totalDisplay.innerText = convertPrice(total, currentCurrency).formatted;
    }

    if (checkoutBtn) {
      checkoutBtn.style.display = "inline-block";
      checkoutBtn.disabled = total <= 0;

      checkoutBtn.addEventListener("click", () => {
        if (total <= 0) return;

        fetch("/checkout", {
          method: "POST",
          credentials: 'include'
        }).then(res => {
          if (res.redirected) {
            window.location.href = res.url;
          }
        });
      });
    }

  } catch (err) {
    console.error("❌ Load error:", err.message);
    if (emptyMsg) emptyMsg.style.display = "block";
    if (totalDisplay) totalDisplay.innerText = convertPrice(0, currentCurrency).formatted;
  }
});


