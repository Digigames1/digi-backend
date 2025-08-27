import { Link } from "react-router-dom";
export default function Footer(){
  return (
    <footer style={{background:"#fff",borderTop:"1px solid var(--card-border)",marginTop:40}}>
      <div className="container" style={{padding:"28px 0", display:"grid", gap:12}}>
        <nav style={{display:"flex",gap:16,flexWrap:"wrap"}}>
          <Link to="/about">About</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/faq">FAQ</Link>
          <Link to="/terms">Terms</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/refunds">Refund Policy</Link>
        </nav>
        <div style={{color:"var(--muted)",fontSize:13, paddingTop:8}}>© 2025 DigiGames</div>
      </div>
    </footer>
  );
}
