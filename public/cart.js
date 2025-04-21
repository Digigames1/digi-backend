document.addEventListener("DOMContentLoaded", async () => {
  const cartItemsContainer = document.getElementById("cartItems");
  const emptyMsg = document.getElementById("emptyCart");
  const checkoutBtn = document.getElementById("checkoutBtn");

  const response = await fetch("/get-cart");
  const cart = await response.json();

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
      <img src="${item.image}" alt="${item.name}" />
      <div>${item.name}</div>
      <div style="font-size: 0.9rem;">$${item.price}</div>
    `;
    cartItemsContainer.appendChild(el);
  });

  checkoutBtn.addEventListener("click", () => {
    fetch("/checkout", { method: "POST" })
      .then(res => {
        if (res.redirected) {
          window.location.href = res.url;
        }
      });
  });
});
