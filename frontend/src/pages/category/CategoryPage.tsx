import { useEffect, useMemo, useState } from "react";
import CategoryBanner from "./CategoryBanner";
import FiltersSidebar, { Filters } from "./FiltersSidebar";
import SortBar from "./SortBar";
import ProductCard from "./ProductCard";
import { Catalog } from "../../lib/services";
import type { CategoryKey, Product } from "./types";

export default function CategoryPage({category}:{category:CategoryKey}){
  const [loading,setLoading] = useState(true);
  const [items,setItems] = useState<Product[]>([]);
  const [total,setTotal] = useState(0);
  const [sort,setSort] = useState("popular");
  const [view,setView] = useState<"grid"|"list">("grid");
  const [filters,setFilters] = useState<Filters>({ platform:"All Platforms", regions:{}, inStock:false });

  const regionsSelected = useMemo(()=>Object.keys(filters.regions).filter(r=>filters.regions[r]), [filters]);

  useEffect(()=>{
    setLoading(true);
    Catalog.list({
      category,
      sort,
      inStock: filters.inStock,
      regions: regionsSelected.length ? regionsSelected : undefined,
    }).then(r=>{ setItems(r.products); setTotal(r.total); })
      .finally(()=>setLoading(false));
  },[category,sort,filters.inStock,regionsSelected.join(",")]);

  return (
    <div className="container">
      <CategoryBanner category={category}/>
      <div style={{display:"grid", gridTemplateColumns:"280px 1fr", gap:16}}>
        <FiltersSidebar value={filters} onChange={setFilters}/>
        <div style={{display:"grid", gap:12}}>
          <SortBar total={total} sort={sort} onSort={setSort} view={view} onView={setView}/>
          {loading ? <div className="muted">Loading…</div> : (
            <div className={view==="grid" ? "grid featured" : "list"}>
              {items.map(p => <ProductCard key={p.id} p={p}/>)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
