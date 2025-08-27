export default function SortBar({total, sort, onSort, view, onView}:{total:number; sort:string; onSort:(v:string)=>void; view:"grid"|"list"; onView:(v:"grid"|"list")=>void;}){
  return (
    <div className="card" style={{padding:"10px 12px", display:"flex", alignItems:"center", justifyContent:"space-between"}}>
      <div className="muted">{total} products found</div>
      <div style={{display:"flex", gap:10, alignItems:"center"}}>
        <label className="muted">Sort by</label>
        <select value={sort} onChange={e=>onSort(e.target.value)}>
          <option value="popular">Popular</option>
          <option value="priceAsc">Price: Low → High</option>
          <option value="priceDesc">Price: High → Low</option>
          <option value="ratingDesc">Rating</option>
        </select>
        <div className="view">
          <button className={"icon-btn"+(view==="grid"?" active":"")} onClick={()=>onView("grid")} aria-label="Grid">▦</button>
          <button className={"icon-btn"+(view==="list"?" active":"")} onClick={()=>onView("list")} aria-label="List">≣</button>
        </div>
      </div>
    </div>
  );
}
