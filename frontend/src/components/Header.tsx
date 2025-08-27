import { Link, NavLink } from "react-router-dom";

export default function Header(){
  return (
    <header className="topbar">
      <div className="container topbar-inner">
        <Link to="/" className="brand">DigiGames</Link>
        <div className="search">
          <input placeholder="Search gift cards..." />
        </div>
        <nav className="topnav">
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/gaming">Gaming</NavLink>
          <NavLink to="/streaming">Streaming</NavLink>
          <NavLink to="/shopping">Shopping</NavLink>
          <NavLink to="/music">Music</NavLink>
          <NavLink to="/fooddrink">Food & Drink</NavLink>
          <NavLink to="/travel">Travel</NavLink>
          <NavLink to="/about">About</NavLink>
          <NavLink to="/contact">Contact</NavLink>
          <NavLink to="/faq">FAQ</NavLink>
        </nav>
      </div>
    </header>
  );
}
