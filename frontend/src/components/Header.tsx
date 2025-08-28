export default function Header() {
  return (
    <>
      <header id="app-header" className="header-wrap">
        {/* верхня смуга */}
        <div className="topbar">
          <div className="container topbar-inner">
            <a href="/" className="brand">DigiGames</a>
            <div className="search">
              <input type="search" placeholder="Search gift cards..." />
            </div>
            <div className="topnav">
              <button className="icon-btn">🌐</button>
              <button className="icon-btn">$</button>
              <button className="icon-btn">🛒</button>
            </div>
          </div>
        </div>
        {/* нижня смуга з категоріями */}
        <nav className="topcats container">
          <a href="/gaming">Gaming</a>
          <a href="/streaming">Streaming</a>
          <a href="/shopping">Shopping</a>
          <a href="/music">Music</a>
          <a href="/fooddrink">Food & Drink</a>
          <a href="/travel">Travel</a>
        </nav>
      </header>
      {/* СПЕЙСЕР: заповнює місце під fixed-хедером */}
      <div className="header-spacer" />
    </>
  );
}
