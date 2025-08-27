import { Link, NavLink } from "react-router-dom";
import GlobeIcon from "./icons/GlobeIcon";
import CurrencyIcon from "./icons/CurrencyIcon";
import CartIcon from "./icons/CartIcon";

export default function Header(){
  return (
    <header className="topbar">
      <div className="container topbar-inner">
        <Link to="/" className="brand">DigiGames</Link>

        <div className="search">
          <input placeholder="Search gift cards..." aria-label="Search gift cards" />
        </div>

        <nav className="topnav" aria-label="Top">
          <button className="icon-btn" aria-label="Language"><GlobeIcon/></button>
          <button className="icon-btn" aria-label="Currency"><CurrencyIcon/></button>
          <Link to="/cart" className="icon-btn" aria-label="Cart"><CartIcon/></Link>
        </nav>
      </div>
      <div className="container" style={{display:"flex",gap:12,alignItems:"center",height:44}}>
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
