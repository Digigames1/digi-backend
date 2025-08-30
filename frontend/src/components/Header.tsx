import { Link, NavLink, useNavigate } from "react-router-dom";
import CartIcon from "./icons/CartIcon";
import { LanguageMenu, CurrencyMenu } from "./menus/LanguageCurrencyMenu";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { totalCount } from "../store/cart";

export default function Header(){
  const [lang,setLang] = useState(localStorage.getItem("dg_language") || "EN");
  const [cur,setCur] = useState(localStorage.getItem("dg_currency") || "USD");
  const [count,setCount] = useState(0);
  const [query,setQuery] = useState("");
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  useEffect(()=>{
    setCount(totalCount());
    const t=setInterval(()=>setCount(totalCount()),800);
    return ()=>clearInterval(t);
  },[]);
  useEffect(()=>{
    localStorage.setItem("dg_currency", cur);
    window.dispatchEvent(new CustomEvent("currencychange",{detail:cur}));
    fetch("/api/fx").then(r=>r.json()).then(d=>{
      if(d?.ok) localStorage.setItem("dg_fx", JSON.stringify(d));
    }).catch(()=>{});
  }, [cur]);
  useEffect(()=>{
    localStorage.setItem("dg_language", lang);
    window.dispatchEvent(new CustomEvent("languagechange",{detail:lang}));
    i18n.changeLanguage(lang.toLowerCase());
  }, [lang]);

  return (
    <header className="header-wrap"> {/* <-- sticky застосуємо до цього контейнера */}
      <div className="topbar">
        <div className="container topbar-inner">
          <Link to="/" className="brand">DigiGames</Link>
          <div className="search" style={{ flex: 1 }}>
            <form
              style={{ width: "100%" }}
              onSubmit={e => {
                e.preventDefault();
                if (!query.trim()) return;
                navigate(`/search?q=${encodeURIComponent(query.trim())}`);
              }}
            >
              <input
                placeholder={t("search_placeholder")}
                value={query}
                onChange={e => setQuery(e.target.value)}
                style={{ width: "100%", padding: "12px 16px", textAlign: "center" }}
              />
            </form>
          </div>
          <nav className="topnav" aria-label="Actions">
            <LanguageMenu value={lang} onChange={setLang}/>
            <CurrencyMenu value={cur} onChange={setCur}/>
            <Link to="/cart" className="icon-btn badge" aria-label="Cart">
              <CartIcon/>{count>0 && <span className="badge-dot">{count}</span>}
            </Link>
          </nav>
        </div>
      </div>

      <div className="topcats container">
        <NavLink to="/" end>{t("home")}</NavLink>
        <NavLink to="/gaming">{t("gaming")}</NavLink>
        <NavLink to="/streaming">{t("streaming")}</NavLink>
        <NavLink to="/shopping">{t("shopping")}</NavLink>
        <NavLink to="/music">{t("music")}</NavLink>
        <NavLink to="/fooddrink">{t("food")}</NavLink>
        <NavLink to="/travel">{t("travel")}</NavLink>
      </div>
    </header>
  );
}
