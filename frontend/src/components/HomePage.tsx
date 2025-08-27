import CategoryCard from "./CategoryCard";
import { getCart, setCart } from "../store/cart";

const categories = [
  { title:"Gaming",      note:"120+ cards", icon:"/assets/icons/gaming.svg",    href:"/gaming" },
  { title:"Streaming",   note:"45+ cards",  icon:"/assets/icons/streaming.svg", href:"/streaming" },
  { title:"Shopping",    note:"200+ cards", icon:"/assets/icons/shopping.svg",  href:"/shopping" },
  { title:"Music",       note:"30+ cards",  icon:"/assets/icons/music.svg",     href:"/music" },
  { title:"Food & Drink",note:"80+ cards",  icon:"/assets/icons/fooddrink.svg", href:"/fooddrink" },
  { title:"Travel",      note:"25+ cards",  icon:"/assets/icons/travel.svg",    href:"/travel" },
];

const featured = [
  { name:"PlayStation Store Gift Card", price:"$50.00", rating:"4.8", img:"/assets/images/ps.webp" },
  { name:"Netflix Gift Card",           price:"$25.00", rating:"4.6", img:"/assets/images/netflix.webp" },
  { name:"Steam Wallet Code",           price:"$20.00", rating:"4.9", img:"/assets/images/steam.webp" },
];

function addToCart(item:any){
  const cur=getCart(); cur.push({name:item.name,price:item.price,img:item.img}); setCart(cur);
  alert("Added to cart");
}

export default function HomePage(){
  return (
    <div className="container">
      <h2 className="section-title">Shop by Category</h2>
      <div className="grid categories">
        {categories.map(c => <CategoryCard key={c.title} {...c} />)}
      </div>

      <h2 className="section-title" style={{marginTop:32}}>Featured Gift Cards</h2>
      <div className="grid featured">
        {featured.map(f=>(
          <div className="card" key={f.name}>
            <img src={f.img} alt={f.name} loading="lazy"/>
            <div className="name">{f.name}</div>
            <div className="price">{f.price}</div>
            <div className="rating">Rating: {f.rating}</div>
            <button className="btn" onClick={()=>addToCart(f)}>Add to cart</button>
          </div>
        ))}
      </div>
    </div>
  );
}
