import type { CategoryKey } from "./types";
const meta: Record<CategoryKey,{title:string; subtitle:string; color:string; icon?:string}> = {
  gaming: { title:"Gaming Gift Cards", subtitle:"Get gift cards for Xbox, PlayStation, and Steam gaming platforms", color:"#ff1f62" },
  streaming: { title:"Streaming Cards", subtitle:"Netflix, Disney+, Spotify & more", color:"#7C3AED" },
  shopping: { title:"Shopping Cards", subtitle:"Amazon, eBay, Target — easy and fast", color:"#2563EB" },
  music: { title:"Music Cards", subtitle:"Apple Music, Spotify, YouTube", color:"#10B981" },
  fooddrink: { title:"Food & Drink Cards", subtitle:"Starbucks, DoorDash, Uber Eats", color:"#F97316" },
  travel: { title:"Travel Cards", subtitle:"Airbnb, Booking.com, Uber", color:"#06B6D4" },
};
export default function CategoryBanner({category}:{category:CategoryKey}){
  const m = meta[category];
  return (
    <div style={{background:m.color, borderRadius:16, color:"#fff", padding:"24px 24px", margin:"16px 0"}}>
      <div className="container" style={{padding:0}}>
        <div style={{fontWeight:700, fontSize:22, marginBottom:6}}>{m.title}</div>
        <div style={{opacity:.9}}>{m.subtitle}</div>
      </div>
    </div>
  );
}
