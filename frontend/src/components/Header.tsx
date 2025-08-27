export default function Header() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <div className="logo">DigiGames</div>
        {/* пошук */}
        <input type="search" className="search" placeholder="Search gift cards..." />
        {/* кнопки мова/валюта/корзина */}
        <div className="header-actions">
          <button className="icon-btn">🌐</button>
          <button className="icon-btn">$</button>
          <button className="icon-btn">🛒</button>
        </div>
      </div>
      {/* навігація */}
      <nav className="nav">
        <a href="/gaming">Gaming</a>
        <a href="/streaming">Streaming</a>
        <a href="/shopping">Shopping</a>
        <a href="/music">Music</a>
        <a href="/fooddrink">Food & Drink</a>
        <a href="/travel">Travel</a>
      </nav>
    </header>
  );
}
