const defaultLang = 'uk';
const userLang = localStorage.getItem("lang") || defaultLang;

async function loadLang(lang) {
  try {
    const res = await fetch(`/lang/${lang}.json`);
    const dict = await res.json();

    // 🔤 Переклад елементів з data-i18n
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      if (dict[key]) {
        el.innerText = dict[key];
      }
    });

    // 📝 Плейсхолдери (якщо є на сторінці)
    const nameInput = document.getElementById("clientName");
    if (nameInput) nameInput.setAttribute("placeholder", dict.name);

    const emailInput = document.getElementById("clientEmail");
    if (emailInput) emailInput.setAttribute("placeholder", dict.email);

    const checkoutBtn = document.getElementById("checkoutBtn");
    if (checkoutBtn) checkoutBtn.innerText = dict.checkout;

  } catch (err) {
    console.error("🌐 Language loading error:", err);
  }
}

loadLang(userLang);

// 🌐 Обробка перемикача мов
const selector = document.getElementById("langSelector");
if (selector) {
  selector.value = userLang;
  selector.addEventListener("change", e => {
    localStorage.setItem("lang", e.target.value);
    location.reload();
  });
}

