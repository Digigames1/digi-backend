const productName = window.location.pathname.slice(1).toLowerCase();
const allowedKeywords = ['playstation', 'steam', 'itunes', 'xbox', 'netflix', 'spotify', 'roblox'];

fetch("/api/bamboo")
  .then(res => res.json())
  .then(data => {
    const items = data.items || [];

    // Знайдемо товар за назвою з URL, якщо вона є в списку дозволених
    const product = items.find(item =>
      allowedKeywords.some(keyword =>
        item.name.toLowerCase().includes(keyword) &&
        productName.includes(keyword)
      )
    );

    if (!product) {
      document.getElementById("product-name").textContent = "Error loading product.";
      return;
    }

    const price = product.products?.[0]?.price?.min || "N/A";

    document.getElementById("product-name").textContent = product.name;
    document.getElementById("product-logo").src = product.logoUrl;
    document.getElementById("product-logo").style.display = "block";
    document.getElementById("product-price").textContent = `Price: $${price}`;
    document.getElementById("product-description").textContent = product.description;

    // Кнопка Купити
    const buyBtn = document.createElement("button");
    buyBtn.textContent = "🛒 Купити";
    buyBtn.style.cssText = "padding: 0.5rem 1rem; font-size: 1rem; background: green; color: white; border: none; border-radius: 4px; cursor: pointer; margin-top: 1rem;";
    buyBtn.onclick = () => alert(`Ти обрав: ${product.name}\nЦіна: $${price}`);
    document.querySelector(".product-container").appendChild(buyBtn);
  })
  .catch(err => {
    document.getElementById("product-name").textContent = "Error loading product.";
    console.error("❌ Fetch error:", err);
  });

