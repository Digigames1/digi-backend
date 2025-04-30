document.addEventListener("DOMContentLoaded", async () => {
  const cartItemsContainer = document.getElementById("cart-items");
  const totalDisplay = document.getElementById("cart-total");
  const emptyMsg = document.getElementById("empty-cart-message");

  const currencySymbols = {
    USD: "$", EUR: "€", UAH: "₴", PLN: "zł", AUD: "A$", CAD: "C$",
  };

  let currentCurrency = localStorage.getItem("currency") || "USD";

  async function renderCart() {
    try {
      const res = await fetch("/api/cart");
      const cart = await res.json();
      console.log("🛒 Отримано кошик:", cart);

      const matchingItems = cart.items.filter(item => {
        return item.currencyCode === currentCurrency && typeof item.price === "number";
      });

      if (!matchingItems.length) {
        emptyMsg.style.display = "block";
        cartItemsContainer.innerHTML = "";
        totalDisplay.innerText = `${currencySymbols[currentCurrency] || '$'}0.00`;
        return;
      }

      cartItemsContainer.innerHTML = "";
      let total = 0;

      matchingItems.forEach(item => {
        const price = typeof item.price === "number" ? item.price : 0;
        const quantity = typeof item.quantity === "number" ? item.quantity : 1;

        const div = document.createElement("div");
        div.className = "cart-item";
        div.innerHTML = `
          <img src="${item.image || '/default-image.png'}" alt="${item.name || 'No Name'}" class="cart-item-img">
          <div class="cart-item-details">
            <strong>${item.brand || ''}</strong><br>
            ${item.name || 'Unnamed Product'}<br>
            ${currencySymbols[item.currencyCode] || '$'}${price.toFixed(2)} × ${quantity}
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
          if (id) {
            await fetch(`/remove-from-cart?id=${id}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ productId: id })
            });
            window.location.reload();
          }
        });
      });
    } catch (err) {
      console.error("❌ Помилка відображення кошика:", err.message);
      if (emptyMsg) emptyMsg.style.display = "block";
      cartItemsContainer.innerHTML = "";
      totalDisplay.innerText = "$0.00";
    }
  }

  const currencySelector = document.getElementById("currencySelector");
  if (currencySelector) {
    currencySelector.value = currentCurrency;
    currencySelector.addEventListener("change", async (e) => {
      currentCurrency = e.target.value;
      localStorage.setItem("currency", currentCurrency);
      renderCart();
    });
  }

  await renderCart();
});

