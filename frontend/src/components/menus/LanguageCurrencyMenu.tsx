import { useState, useEffect, useRef } from "react";

const LANGS = ["EN","UK","PL","DE"];
const CURRENCIES = ["USD","EUR","UAH","CAD","AUD","PLN"];

function useDropdown(){
  const [open,setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const onClick = (e:MouseEvent)=> { if(ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    window.addEventListener("click", onClick);
    return ()=> window.removeEventListener("click", onClick);
  },[]);
  return { open, setOpen, ref };
}

export function LanguageMenu({value,onChange}:{value:string;onChange:(v:string)=>void}){
  const {open,setOpen,ref} = useDropdown();
  return (
    <div className="dd" ref={ref}>
      <button className="icon-btn" onClick={()=>setOpen(!open)} aria-label="Language">{value}</button>
      {open && <div className="dd-menu">{LANGS.map(l=>(
        <button key={l} onClick={()=>{onChange(l); setOpen(false);}}>{l}</button>
      ))}</div>}
    </div>
  );
}
export function CurrencyMenu({value,onChange}:{value:string;onChange:(v:string)=>void}){
  const {open,setOpen,ref} = useDropdown();
  return (
    <div className="dd" ref={ref}>
      <button className="icon-btn" onClick={()=>setOpen(!open)} aria-label="Currency">{value}</button>
      {open && <div className="dd-menu">{CURRENCIES.map(c=>(
        <button key={c} onClick={()=>{onChange(c); setOpen(false);}}>{c}</button>
      ))}</div>}
    </div>
  );
}
