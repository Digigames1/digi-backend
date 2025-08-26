import { NavLink } from 'react-router-dom';

export default function Header() {
  return (
    <header>
      <nav style={{padding: '1rem'}}>
        <NavLink to="/" end>Home</NavLink>
        <NavLink to="/gaming">Gaming</NavLink>
        <NavLink to="/streaming">Streaming</NavLink>
        <NavLink to="/shopping">Shopping</NavLink>
        <NavLink to="/music">Music</NavLink>
        <NavLink to="/fooddrink">Food & Drink</NavLink>
        <NavLink to="/travel">Travel</NavLink>
        <NavLink to="/about">About Us</NavLink>
        <NavLink to="/contact">Contact</NavLink>
        <NavLink to="/faq">FAQ</NavLink>
      </nav>
    </header>
  );
}
