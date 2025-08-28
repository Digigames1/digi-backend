import { Link, NavLink, useNavigate } from "react-router-dom";
import CartIcon from "./icons/CartIcon";
import { LanguageMenu, CurrencyMenu } from "./menus/LanguageCurrencyMenu";
import { useEffect, useState } from "react";
import { totalCount } from "../store/cart";

export default function Header(){
  const [lang,setLang] = useState("EN");
  const [cur,setCur] = useState(localStorage.getItem("dg_currency") || "USD");
  const [count,setCount] = useState(0);
  const [query,setQuery] = useState("");
  const navigate = useNavigate();
  useEffect(()=>{
    setCount(totalCount());
    const t=setInterval(()=>setCount(totalCount()),800);
    return ()=>clearInterval(t);
  },[]);
  useEffect(()=>{ localStorage.setItem("dg_currency", cur); }, [cur]);

  return (
    <header className="header-wrap"> {/* <-- sticky застосуємо до цього контейнера */}
      <div className="topbar">
        <div className="container topbar-inner">
          <Link to="/" className="brand">DigiGames</Link>
          <div className="search"><input
            placeholder="Search gift cards..."
            value={query}
            onChange={e=>setQuery(e.target.value)}
            onKeyDown={async e=>{
              if(e.key!=="Enter"||!query.trim()) return;
              try{
                const res=await fetch(`/api/cards?q=${encodeURIComponent(query.trim())}`);
                const data=await res.json();
                const cat=data.products?.[0]?.category||"gaming";
                navigate(`/${cat}?q=${encodeURIComponent(query.trim())}`);
              }catch(err){
                console.error("search",err);
              }
            }}
          /></div>
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
        <NavLink to="/" end>Home</NavLink>
        <NavLink to="/gaming">Gaming</NavLink>
        <NavLink to="/streaming">Streaming</NavLink>
        <NavLink to="/shopping">Shopping</NavLink>
        <NavLink to="/music">Music</NavLink>
        <NavLink to="/fooddrink">Food & Drink</NavLink>
        <NavLink to="/travel">Travel</NavLink>
      </div>
    </header>
  );
}
