import type { Facets } from "../../lib/types";
export type Filters = { inStock: boolean };
export default function FiltersSidebar({
  value,
  onChange,
  platform,
  onPlatform,
  regions,
  onRegions,
  denoms,
  onDenoms,
  facets,
}:{
  value: Filters;
  onChange: (f: Filters) => void;
  platform: string;
  onPlatform: (p: string) => void;
  regions: string[];
  onRegions: (r: string[]) => void;
  denoms: number[];
  onDenoms: (d: number[]) => void;
  facets: Facets;
}){
  const change = (patch:Partial<Filters>) => onChange({...value, ...patch});
  const platforms = [
    "ALL",
    ...(facets.platforms?.length ? facets.platforms : ["XBOX","PLAYSTATION","NINTENDO","STEAM"]),
  ];
  const toggleRegion = (r:string) => {
    onRegions(regions.includes(r) ? regions.filter(x=>x!==r) : [...regions,r]);
  };
  const toggleDenom = (d:number) => {
    onDenoms(denoms.includes(d) ? denoms.filter(x=>x!==d) : [...denoms,d]);
  };
  return (
    <aside className="card" style={{padding:16, position:"sticky", top:86}}>
      <div className="f-title">Gaming Platform</div>
      <div className="f-stack">
        {platforms.map(p=>(
          <button
            key={p}
            className={"f-pill" + (platform===p ? " active":"")}
            onClick={()=>onPlatform(p)}
          >{p === "ALL" ? "All Platforms" : p}</button>
        ))}
      </div>

      <div className="f-title" style={{marginTop:18}}>Availability</div>
      <label className="f-check">
        <input type="checkbox" checked={value.inStock} onChange={e=>change({inStock:e.target.checked})}/>
        <span>In Stock Only</span>
      </label>

      {facets.regions?.length ? (
        <>
          <div className="f-title" style={{marginTop:18}}>Region</div>
          <div className="f-list">
            {facets.regions.map(r=>(
              <label key={r} className="f-check">
                <input type="checkbox"
                  checked={regions.includes(r)}
                  onChange={()=>toggleRegion(r)}
                />
                <span>{r}</span>
              </label>
            ))}
          </div>
        </>
      ) : null}

      {facets.denominations?.length ? (
        <>
          <div className="f-title" style={{marginTop:18}}>Denomination</div>
          <div className="f-list">
            {facets.denominations.map(d=>(
              <label key={d} className="f-check">
                <input type="checkbox"
                  checked={denoms.includes(d)}
                  onChange={()=>toggleDenom(d)}
                />
                <span>{d}</span>
              </label>
            ))}
          </div>
        </>
      ) : null}
    </aside>
  );
}
