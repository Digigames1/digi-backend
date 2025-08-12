document.addEventListener("DOMContentLoaded", async () => {
  const res = await fetch('/api/cart');
  const cartData = await res.json();
  const items = cartData.items || [];
  const container = document.getElementById("checkoutProduct");

  if (!items.length) {
    container.innerHTML = "<p>Корзина порожня.</p>";
    document.getElementById("checkoutForm").style.display = "none";
    return;
  }

  const product = items[items.length - 1];

  container.innerHTML = `
    <div style="text-align:center;">
      <img src="${product.image}" alt="${product.name}" style="max-width:150px;" />
      <div><strong>${product.name}</strong></div>
      <div style="font-size:1.2rem;">$${product.price}</div>
    </div>
  `;

  document.getElementById("checkoutForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const payload = {
      productId: product.id,
      name: document.getElementById("name").value,
      email: document.getElementById("email").value,
      price: product.price,
      quantity: 1
    };

    const res = await fetch("/api/order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const result = await res.json();

    if (res.ok) {
      alert("✅ Замовлення створено, переходимо до оплати...");
      window.location.href = "/payment";
    } else {
      alert("❌ Помилка: " + (result.error || "Спробуйте ще раз"));
    }
  });
});
