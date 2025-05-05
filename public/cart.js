document.addEventListener("DOMContentLoaded", async () => {
  const cartItemsContainer = document.getElementById("cart-items");
  const totalDisplay = document.getElementById("cart-total");
  const emptyMsg = document.getElementById("empty-cart-message");

  const currencySymbols = {
    USD: "$", EUR: "€", UAH: "₴", PLN: "zł", AUD: "A$", CAD: "C$",
  };

  const currentCurrency = localStorage.getItem("currency") || "USD";
  const now = Date.now();
  const MAX_AGE = 1000 * 60 * 60; // 1 година

  async function renderCart() {
    try {
      const res = await fetch("/api/cart");
      const cart = await res.json();
      const items = cart.items || [];

      console.log("🛒 Усі товари в кошику:", items);

      // Фільтрація тільки за валютою + віком
      const matchingItems = items.filter(item =>
        item.currencyCode === currentCurrency &&
        typeof item.price === "number" &&
        now - (item.addedAt || 0) < MAX_AGE
      );

      if (!matchingItems.length) {
        if (items.length) {
          emptyMsg.innerText = "У кошику є товари з іншою валютою або протерміновані.";
        } else {
          emptyMsg.innerText = "Кошик порожній.";
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
            ${currencySymbols[item.currencyCode]}${price.toFixed(2)} × ${quantity}
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
          await fetch("/remove-from-cart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId: id })
          });
          window.location.reload();
        });
      });
    } catch (err) {
      console.error("❌ Помилка:", err);
    }
  }

  await renderCart();
});


