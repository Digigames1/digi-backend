document.addEventListener("DOMContentLoaded", () => {
  const cartItemsContainer = document.getElementById("cartItems");
  const emptyMsg = document.getElementById("emptyCart");
  const checkoutBtn = document.getElementById("checkoutBtn");

  const cart = JSON.parse(localStorage.getItem("cart")) || [];

  if (cart.length === 0) {
    emptyMsg.style.display = "block";
    checkoutBtn.style.display = "none";
    return;
  }

  emptyMsg.style.display = "none";

  cart.forEach((item, index) => {
    const el = document.createElement("div");
    el.className = "category-card";
    el.innerHTML = `
      <img src="${item.logo}" alt="${item.name}" />
      <div>${item.name}</div>
      <div style="font-size: 0.9rem;">$${item.price}</div>
      <button onclick="removeFromCart(${index})">❌ Remove</button>
    `;
    cartItemsContainer.appendChild(el);
  });

  checkoutBtn.addEventListener("click", () => {
    alert("🧾 Checkout coming soon!");
  });
});

function removeFromCart(index) {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  cart.splice(index, 1);
  localStorage.setItem("cart", JSON.stringify(cart));
  window.location.reload();
}
