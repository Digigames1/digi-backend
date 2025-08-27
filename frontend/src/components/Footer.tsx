import { Link } from "react-router-dom";

export default function Footer(){
  return (
    <footer className="footer">
      <section className="nl">
        <div className="container nl-inner">
          <div className="nl-title">Stay Updated</div>
          <div className="nl-sub">Get the latest gaming deals and new gift cards delivered to your inbox</div>
          <form className="nl-form" onSubmit={(e)=>e.preventDefault()}>
            <input placeholder="Enter your email" type="email" required/>
            <button aria-label="Subscribe">✉️</button>
          </form>
        </div>
      </section>

      <section className="container footer-grid">
        <div>
          <div className="f-brand">DigiGames</div>
          <p className="muted">Your trusted marketplace for digital gift cards. Fast, secure, and reliable for customers worldwide.</p>
          <div className="soc">
            <a href="#" aria-label="X">𝕏</a><a href="#" aria-label="Instagram">◎</a><a href="#" aria-label="YouTube">►</a>
          </div>
        </div>
        <div>
          <div className="f-title">Quick Links</div>
          <nav className="f-list">
            <Link to="/browse">Browse Cards</Link>
            <Link to="/how-it-works">How It Works</Link>
            <Link to="/about">About Us</Link>
            <Link to="/contact">Contact</Link>
          </nav>
        </div>
        <div>
          <div className="f-title">Categories</div>
          <nav className="f-list">
            <Link to="/gaming">Gaming</Link>
            <Link to="/streaming">Streaming</Link>
            <Link to="/shopping">Shopping</Link>
            <Link to="/music">Music</Link>
          </nav>
        </div>
        <div>
          <div className="f-title">Support</div>
          <nav className="f-list">
            <Link to="/help">Help Center</Link>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/refunds">Refund Policy</Link>
          </nav>
        </div>
      </section>

      <div className="container f-copy">© 2025 DigiGames</div>
    </footer>
  );
}
