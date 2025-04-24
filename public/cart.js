document.addEventListener("DOMContentLoaded", async () => {
  const cartItemsContainer = document.getElementById("cart-items"); // 🟩 Фіксований ID (було cartItems)
  const emptyMsg = document.getElementById("empty-cart-message");    // 🟩 Фіксований ID (було emptyCart)
  const checkoutBtn = document.getElementById("checkout-button");    // 🟩 Фіксований ID (було checkoutBtn)

  try {
    const response = await fetch("/get-cart", { credentials: 'include' }); // 🟩 Додано credentials
    const cart = await response.json();

    if (!cart || cart.length === 0) {
      if (emptyMsg) emptyMsg.style.display = "block"; // 🟩 Перевірка, чи існує елемент
      if (checkoutBtn) checkoutBtn.style.display = "none";
      return;
    }

    if (emptyMsg) emptyMsg.style.display = "none";

    cart.forEach((item) => {
      const el = document.createElement("div");
      el.className = "category-card card"; // 🔁 Стилі як на головній
      el.innerHTML = `
        <img src="${item.image || '/icons/default.png'}" alt="${item.name}" />
        <div>${item.name}</div>
        <div style="font-size: 0.9rem;">$${item.price.toFixed(2)}</div>
      `;
      cartItemsContainer.appendChild(el);
    });

    if (checkoutBtn) {
      checkoutBtn.addEventListener("click", () => {
        fetch("/checkout", {
          method: "POST",
          credentials: 'include' // 🟩 Передавати кукі при переході
        })
        .then(res => {
          if (res.redirected) {
            window.location.href = res.url;
          }
        });
      });
    }
  } catch (err) {
    console.error("❌ Load error:", err.message);
    if (emptyMsg) emptyMsg.style.display = "block";
  }
});

