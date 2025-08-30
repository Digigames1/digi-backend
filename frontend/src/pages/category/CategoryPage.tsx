import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import CategoryBanner from "./CategoryBanner";
import FiltersSidebar, { Filters } from "./FiltersSidebar";
import SortBar from "./SortBar";
import { ProductCard } from "../../components/ProductCard";
import { Catalog } from "../../lib/services";
import type { Product, Facets } from "../../lib/types";
import type { CategoryKey } from "./types";

export default function CategoryPage({category}:{category:CategoryKey}){
  const [loading,setLoading] = useState(false);
  const [err,setErr] = useState<string | null>(null);
  const [items,setItems] = useState<Product[]>([]);
  const [total,setTotal] = useState(0);
  const [sort,setSort] = useState("popular");
  const [view,setView] = useState<"grid"|"list">("grid");
  const [filters,setFilters] = useState<Filters>({ inStock:false });
  const [platform,setPlatform] = useState<"ALL"|"XBOX"|"PLAYSTATION"|"STEAM"|"NINTENDO">("ALL");
  const [regions,setRegions] = useState<string[]>([]);
  const [denoms,setDenoms] = useState<number[]>([]);
  const [facets,setFacets] = useState<Facets>({});
  const [currency,setCurrency] = useState(localStorage.getItem("dg_currency") || "USD");
  const [lang,setLang] = useState(localStorage.getItem("dg_language") || "EN");
  const loc = useLocation();
  const q = new URLSearchParams(loc.search).get("q") || "";

  useEffect(()=>{
    const curH = () => setCurrency(localStorage.getItem("dg_currency") || "USD");
    const langH = () => setLang(localStorage.getItem("dg_language") || "EN");
    window.addEventListener("currencychange", curH);
    window.addEventListener("languagechange", langH);
    return () => { window.removeEventListener("currencychange", curH); window.removeEventListener("languagechange", langH); };
  },[]);

  useEffect(()=>{
    setLoading(true);
    const params: any = {
      category,
      regions,
      denoms,
      sort,
      inStock: filters.inStock,
      q,
      currency,
      lang,
    };
    if (platform !== "ALL") params.platform = platform;
    Catalog.list(params)
      .then(res => { setItems(res.products||[]); setTotal(res.total||0); setFacets(res.facets||{}); })
      .catch(()=>{ setItems([]); setTotal(0); })
      .finally(()=> setLoading(false));
  }, [category, platform, regions.join(","), denoms.join(","), sort, filters.inStock, q, currency, lang]);

  return (
    <div className="container">
      <CategoryBanner category={category}/>
      <div style={{display:"grid", gridTemplateColumns:"280px 1fr", gap:16}}>
        <FiltersSidebar
          value={filters}
          onChange={setFilters}
          platform={platform}
          onPlatform={setPlatform}
          regions={regions}
          onRegions={setRegions}
          denoms={denoms}
          onDenoms={setDenoms}
          facets={facets}
        />
        <div style={{display:"grid", gap:12}}>
          <SortBar total={total} sort={sort} onSort={setSort} view={view} onView={setView}/>
          {loading ? <div className="muted">Loading…</div> : err ? <div className="error">{err}</div> : (
            items.length ? (
              <div className={view==="grid" ? "grid featured" : "list"}>
                {items.map(p => <ProductCard key={p.id} product={p}/>)}
              </div>
            ) : <div>No products found</div>
          )}
        </div>
      </div>
    </div>
  );
}
