import { useEffect, useMemo, useState } from "react";
import CategoryBanner from "./CategoryBanner";
import FiltersSidebar, { Filters } from "./FiltersSidebar";
import SortBar from "./SortBar";
import ProductCard from "./ProductCard";
import { api } from "../../lib/api";
import type { Product, ProductsResponse } from "../../lib/types";
import type { CategoryKey } from "./types";

const buildQuery = (opts: {
  category: string;
  q?: string;
  sort?: string;
  regions?: string[];
  inStock?: boolean;
}) => {
  const p = new URLSearchParams();
  if (opts.category) p.set("category", opts.category);
  if (opts.q) p.set("q", opts.q);
  if (opts.sort) p.set("sort", opts.sort);
  if (opts.regions?.length) p.set("regions", opts.regions.join(","));
  if (typeof opts.inStock === "boolean") p.set("inStock", String(opts.inStock));
  const s = p.toString();
  return s ? `?${s}` : "";
};

export default function CategoryPage({category}:{category:CategoryKey}){
  const [loading,setLoading] = useState(false);
  const [err,setErr] = useState<string | null>(null);
  const [items,setItems] = useState<Product[]>([]);
  const [total,setTotal] = useState(0);
  const [sort,setSort] = useState("popular");
  const [view,setView] = useState<"grid"|"list">("grid");
  const [filters,setFilters] = useState<Filters>({ platform:"All Platforms", regions:{}, inStock:false });

  const regionsSelected = useMemo(()=>Object.keys(filters.regions).filter(r=>filters.regions[r]), [filters]);

  const query = useMemo(() => buildQuery({
    category,
    sort,
    regions: regionsSelected.length ? regionsSelected : undefined,
    inStock: filters.inStock,
  }), [category, sort, regionsSelected.join(","), filters.inStock]);

  useEffect(()=>{
    let alive = true;
    setLoading(true);
    setErr(null);
    api.get<ProductsResponse>(`/cards${query}`)
      .then(data => {
        if (!alive) return;
        setItems(data?.products ?? []);
        setTotal(data?.total ?? 0);
      })
      .catch(e => {
        if (!alive) return;
        setErr(e?.message || "Failed to load products");
        setItems([]);
        setTotal(0);
      })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [query]);

  return (
    <div className="container">
      <CategoryBanner category={category}/>
      <div style={{display:"grid", gridTemplateColumns:"280px 1fr", gap:16}}>
        <FiltersSidebar value={filters} onChange={setFilters}/>
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
