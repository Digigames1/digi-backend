const defaultLang = 'uk';
const userLang = localStorage.getItem("lang") || defaultLang;

async function loadLang(lang) {
  try {
    const res = await fetch(`/lang/${lang}.json`);
    const dict = await res.json();

    document.querySelector(".section-title")?.innerText = dict.title;
    document.querySelectorAll(".buy-btn").forEach(btn => btn.innerText = dict.buy);
    document.getElementById("clientName")?.setAttribute("placeholder", dict.name);
    document.getElementById("clientEmail")?.setAttribute("placeholder", dict.email);
    document.getElementById("checkoutBtn")?.innerText = dict.checkout;
  } catch (err) {
    console.error("🌐 Language loading error:", err);
  }
}

loadLang(userLang);

document.getElementById("langSelector")?.addEventListener("change", e => {
  localStorage.setItem("lang", e.target.value);
  location.reload();
});

document.getElementById("langSelector")?.value = userLang;
