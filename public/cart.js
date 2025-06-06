document.addEventListener("DOMContentLoaded", async () => {
  const cartItemsContainer = document.getElementById("cart-items");
  const totalDisplay = document.getElementById("cart-total");
  const emptyMsg = document.getElementById("empty-cart-message");

  const currencySymbols = {
    USD: "$", EUR: "€", UAH: "₴", PLN: "zł", AUD: "A$", CAD: "C$",
  };

  let currentCurrency = localStorage.getItem("currency") || "USD";
  let isClearing = false;

  
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

  return await renderCart();
}

    console.log("🎯 Перевірка умов:");

    const matchingItems = cart.items.filter(item => {
      const isCurrencyOk = item.currencyCode === currentCurrency;
      const isPriceOk = typeof item.price === "number";
      const isRecent = now - (item.addedAt || 0) < MAX_AGE;

      if (!isCurrencyOk || !isPriceOk || !isRecent) {
        console.warn("⛔ Відфільтровано товар:", {
          name: item.name,
          currencyCode: item.currencyCode,
          expectedCurrency: currentCurrency,
          price: item.price,
          addedAt: item.addedAt,
          reasons: {
            currencyMatch: isCurrencyOk,
            priceValid: isPriceOk,
            timeValid: isRecent
          }
        });
      }

      return isCurrencyOk && isPriceOk && isRecent;
    });

    if (!matchingItems.length) {
      if (cart.items.length) {
        emptyMsg.innerText = "У кошику є товари іншої валюти або протерміновані.";
      } else {
        emptyMsg.innerText = "Ваш кошик порожній.";
      }
      emptyMsg.style.display = "block";
      cartItemsContainer.innerHTML = "";
      totalDisplay.innerText = `${currencySymbols[currentCurrency] || "$"}0.00`;
      return;
    }

    cartItemsContainer.innerHTML = "";
    let total = 0;

    matchingItems.forEach(item => {
      const price = Number(item.price) || 0;
      const quantity = item.quantity || 1;

      const div = document.createElement("div");
      div.className = "cart-item";
      div.innerHTML = `
        <img src="${item.image || '/default-image.png'}" alt="${item.name}" class="cart-item-img">
        <div class="cart-item-details">
          <strong>${item.name}</strong><br>
          ${currencySymbols[item.currencyCode] || currentCurrency}${price.toFixed(2)} × ${quantity}
        </div>
        <button class="remove-btn" data-id="${item._id}">🗑️</button>
      `;
      cartItemsContainer.appendChild(div);

      total += price * quantity;
    });

    totalDisplay.innerText = `${currencySymbols[currentCurrency]}${total.toFixed(2)}`;

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

  await renderCart();
});







