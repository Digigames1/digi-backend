document.addEventListener("DOMContentLoaded", async () => {
  const cartItemsContainer = document.getElementById("cart-items");
  const totalDisplay = document.getElementById("cart-total");
  const emptyMsg = document.getElementById("empty-cart-message");

  const currencySymbols = {
    USD: "$", EUR: "€", UAH: "₴", PLN: "zł", AUD: "A$", CAD: "C$",
  };

  let currentCurrency = localStorage.getItem("currency") || "USD";
  let rates = { USD: 1 };

  async function loadRates() {
    try {
      const res = await fetch("https://api.frankfurter.app/latest?from=USD&to=EUR,UAH,PLN,AUD,CAD");
      const data = await res.json();
      if (!data.rates) throw new Error("Курси не знайдено у відповіді");
      rates = { USD: 1, ...data.rates };
      if (!rates.UAH) rates.UAH = 39;
    } catch (err) {
      console.error("Помилка завантаження курсів:", err);
      rates = { USD: 1, UAH: 39 };
    }
  }

  function convertPrice(price, from, to) {
    const usd = price / (rates[from] || 1);
    return usd * (rates[to] || 1);
  }

  async function renderCart() {
    try {
      const res = await fetch("/api/cart");
      const cart = await res.json();

      const now = Date.now();
      const MAX_AGE = 1000 * 60 * 30; // 30 хв

      if (!cart.items || !Array.isArray(cart.items)) {
        console.error("❌ Некоректна відповідь від API /api/cart:", cart);
        return;
      }

      const items = cart.items.filter(item => {
        const isPriceOk = typeof item.price === "number";
        const isRecent = now - (item.addedAt || 0) < MAX_AGE;
        return isPriceOk && isRecent;
      });

      if (!items.length) {
        emptyMsg.style.display = "block";
        cartItemsContainer.innerHTML = "";
        totalDisplay.innerText = `${currencySymbols[currentCurrency] || "$"}0.00`;
        return;
      }

      emptyMsg.style.display = "none";
      cartItemsContainer.innerHTML = "";
      let total = 0;

      items.forEach(item => {
        const quantity = item.quantity || 1;
        const converted = convertPrice(Number(item.price) || 0, item.currencyCode || "USD", currentCurrency);

        const div = document.createElement("div");
        div.className = "cart-item";
        div.innerHTML = `
          <img src="${item.image || '/default-image.png'}" alt="${item.name}" class="cart-item-img">
          <div class="cart-item-details">
            <strong>${item.name}</strong><br>
            ${currencySymbols[currentCurrency]}${converted.toFixed(2)} × ${quantity}
          </div>
          <button class="remove-btn" data-id="${item._id}">🗑️</button>
        `;
        cartItemsContainer.appendChild(div);

        total += converted * quantity;
      });

      totalDisplay.innerText = `${currencySymbols[currentCurrency]}${total.toFixed(2)}`;

      document.querySelectorAll(".remove-btn").forEach(btn => {
        btn.addEventListener("click", async (e) => {
          const id = e.target.getAttribute("data-id");
          const response = await fetch("/remove-from-cart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId: id })
          });
          if (response.ok) {
            await renderCart();
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
      const response = await fetch("/add-to-cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id,
          name,
          price,
          currencyCode: currencyCode || localStorage.getItem("currency") || "USD",
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

  document.getElementById("checkout-button")?.addEventListener("click", () => {
    const totalText = document.getElementById("cart-total")?.innerText || "$0.00";
    sessionStorage.setItem("cartTotal", totalText);
    window.location.href = "/checkout.html";
  });

  const currencySelect = document.getElementById("currencySelector");
  if (currencySelect) {
    currencySelect.value = currentCurrency;
    currencySelect.addEventListener("change", async (e) => {
      currentCurrency = e.target.value;
      localStorage.setItem("currency", currentCurrency);
      await renderCart();
    });
  }

  await loadRates();
  await renderCart();
});

