import { NavLink } from 'react-router-dom';

export default function Footer() {
  return (
    <footer>
      <div className="footer-links">
        <NavLink to="/about">About</NavLink>
        <NavLink to="/contact">Contact</NavLink>
        <NavLink to="/faq">FAQ</NavLink>
      </div>
      <p>&copy; {new Date().getFullYear()} DigiGames</p>
    </footer>
  );
}
