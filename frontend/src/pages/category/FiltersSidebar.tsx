import { useMemo } from "react";
export type Filters = { platform: string; regions: Record<string,boolean>; inStock: boolean };
export default function FiltersSidebar({value,onChange}:{value:Filters; onChange:(f:Filters)=>void}){
  const change = (patch:Partial<Filters>) => onChange({...value, ...patch});
  const platforms = ["All Platforms","Xbox","PlayStation","Steam"];
  const regions = useMemo(()=>["US","EU","UA","PL","NL","DE","CA"],[]);
  return (
    <aside className="card" style={{padding:16, position:"sticky", top:86}}>
      <div className="f-title">Gaming Platform</div>
      <div className="f-stack">
        {platforms.map(p=>(
          <button key={p}
            className={"f-pill" + (value.platform===p ? " active":"")}
            onClick={()=>change({platform:p})}
          >{p}</button>
        ))}
      </div>

      <div className="f-title" style={{marginTop:18}}>Availability</div>
      <label className="f-check">
        <input type="checkbox" checked={value.inStock} onChange={e=>change({inStock:e.target.checked})}/>
        <span>In Stock Only</span>
      </label>

      <div className="f-title" style={{marginTop:18}}>Region</div>
      <div className="f-list">
        {regions.map(r=>(
          <label key={r} className="f-check">
            <input type="checkbox"
              checked={value.regions[r] ?? false}
              onChange={e=>change({regions:{...value.regions,[r]:e.target.checked}})}
            />
            <span>{r}</span>
          </label>
        ))}
      </div>
    </aside>
  );
}
