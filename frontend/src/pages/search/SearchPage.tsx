import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Search } from "../../lib/search";
import { ProductCard } from "../../components/ProductCard";
import type { Product } from "../../lib/types";

export default function SearchPage() {
  const q = new URLSearchParams(useLocation().search).get("q") || "";
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (q.trim().length < 2) {
      setItems([]);
      return;
    }
    let alive = true;
    setLoading(true);
    const t = setTimeout(() => {
      Search.find(q)
        .then((res) => alive && setItems(res.products || []))
        .finally(() => alive && setLoading(false));
    }, 300);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [q]);

  return (
    <div className="container">
      <h1>Results for “{q}”</h1>
      {q.trim().length < 2 ? (
        <p>Please enter at least 2 characters to search.</p>
      ) : loading ? (
        <div className="skeleton-grid" />
      ) : items.length ? (
        <div className="grid">
          {items.map((p) => (
            <div key={p.id} style={{ display: "grid", gap: 8 }}>
              <ProductCard product={p} />
              {p.category && (
                <Link
                  to={`/${p.category}?highlight=${p.id}`}
                  className="btn sm secondary"
                >
                  View in category
                </Link>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p>No results for “{q}”.</p>
      )}
    </div>
  );
}
