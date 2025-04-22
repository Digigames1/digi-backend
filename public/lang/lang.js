const defaultLang = 'uk';
const userLang = localStorage.getItem("lang") || defaultLang;

async function loadLang(lang) {
  try {
    const res = await fetch(`/lang/${lang}.json`);
    const dict = await res.json();

    // Переклад елементів з атрибутом data-i18n
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      if (dict[key]) {
        el.innerText = dict[key];
      }
    });

    // Додаткові поля форми (плейсхолдери або кнопки)
    document.getElementById("clientName")?.setAttribute("placeholder", dict.name);
    document.getElementById("clientEmail")?.setAttribute("placeholder", dict.email);
    document.getElementById("checkoutBtn")?.innerText = dict.checkout;

  } catch (err) {
    console.error("🌐 Language loading error:", err);
  }
}

loadLang(userLang);

// 🎯 Обробка зміни мови в селекторі
const selector = document.getElementById("langSelector");
if (selector) {
  selector.value = userLang;
  selector.addEventListener("change", e => {
    localStorage.setItem("lang", e.target.value);
    location.reload();
  });
}

