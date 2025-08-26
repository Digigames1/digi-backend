const categories = [
  { key:"gaming",    title:"Gaming",    icon:"/assets/icons/gaming.svg",    href:"/gaming",    note:"120+ cards" },
  { key:"streaming", title:"Streaming", icon:"/assets/icons/streaming.svg", href:"/streaming", note:"45+ cards" },
  { key:"shopping",  title:"Shopping",  icon:"/assets/icons/shopping.svg",  href:"/shopping",  note:"200+ cards" },
  { key:"music",     title:"Music",     icon:"/assets/icons/music.svg",     href:"/music",     note:"30+ cards" },
  { key:"fooddrink", title:"Food & Drink", icon:"/assets/icons/fooddrink.svg", href:"/fooddrink", note:"80+ cards" },
  { key:"travel",    title:"Travel",    icon:"/assets/icons/travel.svg",    href:"/travel",    note:"25+ cards" },
];

const featured = [
  { title:"PlayStation Store Gift Card", image:"/assets/icons/playstation.svg", price:50, rating:4.8 },
  { title:"Netflix Gift Card", image:"/assets/icons/netflix.svg", price:25, rating:4.6 },
  { title:"Steam Wallet Code", image:"/assets/icons/steam.svg", price:20, rating:4.9 },
];

export default function HomePage(){
  return (
    <div className="grid">
      <section>
        <h2>Shop by Category</h2>
        <div className="grid categories">
          {categories.map(cat => (
            <div key={cat.key} className="card">
              <img className="cat-icon" src={cat.icon} alt={cat.title} loading="lazy"/>
              <div className="title">{cat.title}</div>
              <div className="muted">{cat.note}</div>
              <a className="link" href={cat.href}>Browse {cat.title} cards</a>
            </div>
          ))}
        </div>
      </section>
      <section>
        <h2>Featured Gift Cards</h2>
        <div className="grid featured">
          {featured.map(card => (
            <div key={card.title} className="card">
              <img src={card.image} alt={card.title} loading="lazy"/>
              <div className="title">{card.title}</div>
              <div>${card.price.toFixed(2)}</div>
              <div className="muted">Rating: {card.rating}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
