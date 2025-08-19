document.addEventListener("DOMContentLoaded", async () => {
  const cartItemsContainer = document.getElementById("cart-items");
  const totalDisplay = document.getElementById("cart-total");
  const emptyMsg = document.getElementById("empty-cart-message");

  const currencySymbols = {
    USD: "$", EUR: "€", UAH: "₴", PLN: "zł", AUD: "A$", CAD: "C$",
  };
  let rates = { USD: 1 };
  let currentCurrency = localStorage.getItem("currency") || "USD";
  let isClearing = false;

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

  function toUSD(amount, fromCurrency) {
    const rate = rates[fromCurrency] || 1;
    return amount / rate;
  }

  
async function renderCart() {
  try {
    const res = await fetch("/api/cart");
    const cart = await res.json();

    console.log("🛒 Усі товари в кошику:", cart.items);

    const now = Date.now();
    const MAX_AGE = 1000 * 60 * 30; // 30 хв

    // 🧼 Перевірка на невалідні товари
    if (!cart.items || !Array.isArray(cart.items)) {
      console.error("❌ Некоректна відповідь від API /api/cart:", cart);
      return;
    }

    const hasInvalidItems = cart.items.some(item =>
      typeof item.price !== "number" || !item.currencyCode || !item.addedAt
    );

    if (hasInvalidItems) {
      if (isClearing) return; // запобігаємо повторному виклику
      console.warn("🧹 Виявлено невалідні товари — очищаємо сесію");
      isClearing = true;
      try {
        await fetch("/clear-cart", { method: "POST" });
      } finally {
        isClearing = false;
      }
      return await renderCart();
    }

    const validItems = cart.items.filter(item => {
      const isPriceOk = typeof item.price === "number";
      const isRecent = now - (item.addedAt || 0) < MAX_AGE;

      if (!isPriceOk || !isRecent) {
        console.warn("⛔ Відфільтровано товар:", {
          name: item.name,
          currencyCode: item.currencyCode,
          price: item.price,
          addedAt: item.addedAt,
          reasons: {
            priceValid: isPriceOk,
            timeValid: isRecent
          }
        });
      }

      return isPriceOk && isRecent;
    });

    if (!validItems.length) {
      if (cart.items.length) {
        emptyMsg.innerText = "У кошику є протерміновані або некоректні товари.";
      } else {
        emptyMsg.innerText = "Ваш кошик порожній.";
      }
      emptyMsg.style.display = "block";
      cartItemsContainer.innerHTML = "";
      totalDisplay.innerText = `${currencySymbols[currentCurrency] || "$"}0.00`;
      return;
    }

    cartItemsContainer.innerHTML = "";
    let totalUSD = 0;

    validItems.forEach(item => {
      const usdPrice = Number(item.price) || 0;
      const quantity = item.quantity || 1;

      const div = document.createElement("div");
      div.className = "cart-item";
      div.innerHTML = `
        <img src="${item.image || '/default-image.png'}" alt="${item.name}" class="cart-item-img">
        <div class="cart-item-details">
          <strong>${item.name}</strong><br>
          ${convertPrice(usdPrice, currentCurrency)} × ${quantity}
        </div>
        <button class="remove-btn" data-id="${item._id}">🗑️</button>
      `;
      cartItemsContainer.appendChild(div);

      totalUSD += usdPrice * quantity;
    });

    totalDisplay.innerText = convertPrice(totalUSD, currentCurrency);

    document.querySelectorAll(".remove-btn").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        const id = e.target.getAttribute("data-id");
        const response = await fetch(`/remove-from-cart?id=${id}`, {
          method: "POST"
        });
        if (response.ok) {
          await renderCart(); // 🔁 Оновлюємо без перезавантаження
        } else {
          alert("❌ Не вдалося видалити товар");
        }
      });
    });

  } catch (err) {
    console.error("❌ Помилка при відображенні кошика:", err);
  }
}


window.addToCart = async function ({ id, name, price, currencyCode, image }) {
    try {
      const originalCurrency = currencyCode || localStorage.getItem("currency") || "USD";
      const priceUSD = toUSD(Number(price) || 0, originalCurrency);
      const response = await fetch("/add-to-cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id,
          name,
          price: priceUSD,
          currencyCode: originalCurrency,
          image,
          quantity: 1,
          addedAt: Date.now()
        })
      });

      if (response.ok) {
        await renderCart();
      } else {
        alert("❌ Не вдалося додати товар");
      }
    } catch (err) {
      console.error("❌ Помилка при додаванні товару:", err);
    }
  };

  // ✅ Збереження суми для checkout
  document.getElementById("checkout-button")?.addEventListener("click", () => {
    const totalText = document.getElementById("cart-total")?.innerText || "$0.00";
    sessionStorage.setItem("cartTotal", totalText);
    window.location.href = "/checkout.html";
  });
  document.getElementById("clear-cart-button")?.addEventListener("click", async () => {
  const res = await fetch("/clear-cart", { method: "POST" });
  if (res.ok) {
    await renderCart(); // перерендер
  } else {
    alert("❌ Не вдалося очистити кошик");
  }
});

  await loadRates();
  await renderCart();
});







