import { useEffect, useState } from "react";
import CategoryCard from "./CategoryCard";
import { ProductCard } from "./ProductCard";
import { Catalog } from "../lib/services";
import type { Product } from "../lib/types";

const categories = [
  { key:"gaming",    title:"Gaming",      note:"120+ cards", icon:"/assets/icons/gaming.svg",    href:"/gaming" },
  { key:"streaming", title:"Streaming",   note:"45+ cards",  icon:"/assets/icons/streaming.svg", href:"/streaming" },
  { key:"shopping",  title:"Shopping",    note:"200+ cards", icon:"/assets/icons/shopping.svg",  href:"/shopping" },
  { key:"music",     title:"Music",       note:"30+ cards",  icon:"/assets/icons/music.svg",     href:"/music" },
  { key:"fooddrink", title:"Food & Drink",note:"80+ cards",  icon:"/assets/icons/fooddrink.svg", href:"/fooddrink" },
  { key:"travel",    title:"Travel",      note:"25+ cards",  icon:"/assets/icons/travel.svg",    href:"/travel" },
];

export default function HomePage(){
  const [items, setItems] = useState<Record<string, Product[]>>({});

  useEffect(() => {
    Promise.all(
      categories.map(c =>
        Catalog.list({ category: c.key, limit: 4 })
          .then(res => [c.key, res.products || []] as [string, Product[]])
          .catch(() => [c.key, []] as [string, Product[]])
      )
    ).then(entries => {
      setItems(Object.fromEntries(entries));
    });
  }, []);

  return (
    <div className="container">
      <h2 className="section-title">Shop by Category</h2>
      <div className="grid categories">
        {categories.map(c => (
          <CategoryCard key={c.key} icon={c.icon} title={c.title} note={c.note} href={c.href} />
        ))}
      </div>

      {categories.map(c => (
        items[c.key]?.length ? (
          <div key={c.key}>
            <h2 className="section-title" style={{marginTop:32}}>{c.title} Gift Cards</h2>
            <div className="grid featured">
              {items[c.key].map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        ) : null
      ))}
    </div>
  );
}
