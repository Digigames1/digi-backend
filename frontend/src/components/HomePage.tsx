import { useEffect, useState } from "react";
import CategoryCard from "./CategoryCard";
import { ProductCard } from "./ProductCard";
import { Catalog } from "../lib/services";
import type { Product } from "../lib/types";
import { useTranslation } from "react-i18next";

const categories = [
  { key: "gaming", icon: "/assets/icons/gaming.svg", href: "/gaming" },
  { key: "streaming", icon: "/assets/icons/streaming.svg", href: "/streaming" },
  { key: "shopping", icon: "/assets/icons/shopping.svg", href: "/shopping" },
  { key: "music", icon: "/assets/icons/music.svg", href: "/music" },
  { key: "fooddrink", icon: "/assets/icons/fooddrink.svg", href: "/fooddrink" },
  { key: "travel", icon: "/assets/icons/travel.svg", href: "/travel" }
];

export default function HomePage(){
  const [sections, setSections] = useState<Record<string, Product[]>>({});
  const { t } = useTranslation();

  useEffect(()=>{
    categories.forEach(c => {
      Catalog.list({ category: c.key, limit: 4 })
        .then(res => setSections(s => ({...s, [c.key]: res.products || []})))
        .catch(()=>{});
    });
  },[]);

  return (
    <div className="container">
      <h2 className="section-title">{t("shop_by_category")}</h2>
      <div className="grid categories">
        {categories.map(c => (
          <CategoryCard key={c.key} icon={c.icon} title={t(c.key)} note={t(`${c.key}_note`)} href={c.href} />
        ))}
      </div>

      {categories.map(c => (
        <section key={c.key}>
          <h2 className="section-title" style={{marginTop:32}}>{t(c.key)}</h2>
          <div className="grid featured">
            {(sections[c.key] || []).map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
