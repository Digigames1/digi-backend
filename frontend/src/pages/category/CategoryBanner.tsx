import { useTranslation } from "react-i18next";
import type { CategoryKey } from "./types";

const meta: Record<CategoryKey,{title:string; subtitle:string; color:string; icon?:string}> = {
  gaming: { title:"gaming_banner_title", subtitle:"gaming_banner_subtitle", color:"#ff1f62" },
  streaming: { title:"streaming_banner_title", subtitle:"streaming_banner_subtitle", color:"#7C3AED" },
  shopping: { title:"shopping_banner_title", subtitle:"shopping_banner_subtitle", color:"#2563EB" },
  music: { title:"music_banner_title", subtitle:"music_banner_subtitle", color:"#10B981" },
  fooddrink: { title:"fooddrink_banner_title", subtitle:"fooddrink_banner_subtitle", color:"#F97316" },
  travel: { title:"travel_banner_title", subtitle:"travel_banner_subtitle", color:"#06B6D4" },
};
export default function CategoryBanner({category}:{category:CategoryKey}){
  const m = meta[category];
  const { t } = useTranslation();
  return (
    <div style={{background:m.color, borderRadius:16, color:"#fff", padding:"24px 24px", margin:"16px 0"}}>
      <div className="container" style={{padding:0}}>
        <div style={{fontWeight:700, fontSize:22, marginBottom:6}}>{t(m.title)}</div>
        <div style={{opacity:.9}}>{t(m.subtitle)}</div>
      </div>
    </div>
  );
}
