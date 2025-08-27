import { Link, NavLink } from "react-router-dom";
import CartIcon from "./icons/CartIcon";
import { LanguageMenu, CurrencyMenu } from "./menus/LanguageCurrencyMenu";
import { useEffect, useState } from "react";
import { totalCount } from "../store/cart";

export default function Header(){
  const [lang,setLang] = useState("EN");
  const [cur,setCur] = useState("USD");
  const [count,setCount] = useState(0);

  useEffect(()=>{
    setCount(totalCount());
    const i = setInterval(()=>setCount(totalCount()), 800); // simple polling localStorage
    return ()=> clearInterval(i);
  },[]);

  return (
    <header className="topbar">
      <div className="container topbar-inner">
        <Link to="/" className="brand">DigiGames</Link>
        <div className="search"><input placeholder="Search gift cards..." /></div>
        <nav className="topnav" aria-label="Actions">
          <LanguageMenu value={lang} onChange={setLang}/>
          <CurrencyMenu value={cur} onChange={setCur}/>
          <Link to="/cart" className="icon-btn badge" aria-label="Cart">
            <CartIcon/>
            {count>0 && <span className="badge-dot">{count}</span>}
          </Link>
        </nav>
      </div>

      {/* lower navigation row only categories */}
      <div className="container topcats">
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
