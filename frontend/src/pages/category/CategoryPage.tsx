import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import CategoryBanner from "./CategoryBanner";
import FiltersSidebar, { Filters } from "./FiltersSidebar";
import SortBar from "./SortBar";
import ProductCard from "./ProductCard";
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
  const [platform,setPlatform] = useState<"XBOX"|"PLAYSTATION"|"STEAM">("XBOX");
  const [regions,setRegions] = useState<string[]>([]);
  const [denoms,setDenoms] = useState<number[]>([]);
  const [facets,setFacets] = useState<Facets>({});
  const loc = useLocation();
  const q = new URLSearchParams(loc.search).get("q") || "";

  useEffect(()=>{
    setLoading(true);
    Catalog.list({ category, platform, regions, denoms, sort, inStock: filters.inStock, q })
      .then(res => { setItems(res.products||[]); setTotal(res.total||0); setFacets(res.facets||{}); })
      .catch(()=>{ setItems([]); setTotal(0); })
      .finally(()=> setLoading(false));
  }, [category, platform, regions.join(","), denoms.join(","), sort, filters.inStock, q]);

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
                {items.map(p => <ProductCard key={p.id} p={p}/>)}
              </div>
            ) : <div>No products found</div>
          )}
        </div>
      </div>
    </div>
  );
}
