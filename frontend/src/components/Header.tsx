import { NavLink } from 'react-router-dom';

export default function Header() {
  return (
    <header>
      <div className="container header-flex">
        <NavLink to="/" className="logo" end>
          <img src="/assets/icons/logo.svg" alt="DigiGames" />
          DigiGames
        </NavLink>
        <nav>
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
