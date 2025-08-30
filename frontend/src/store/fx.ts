let cache: { base:string; rates:Record<string,number>; fetchedAt:number } | null = null;

export async function loadRates(){
  if (cache && Date.now()-cache.fetchedAt < 60*60*1000) return cache;
  const r = await fetch("/api/fx");
  const d = await r.json();
  if (d?.ok) {
    cache = { base:d.base, rates:d.rates, fetchedAt:Date.now() };
    return cache;
  }
  throw new Error("fx load failed");
}

export function convert(amount:number, from:string, to:string){
  if(!cache) return amount;
  const r = cache.rates;
  if(from === cache.base) return amount*(r[to] || 1);
  if(to === cache.base) return amount/(r[from] || 1);
  return (amount/(r[from] || 1))*(r[to] || 1);
}
