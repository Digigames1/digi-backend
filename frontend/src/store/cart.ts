export type Item={name:string,price:string,img?:string};
const key="dg_cart";
export const getCart=():Item[]=>{try{return JSON.parse(localStorage.getItem(key)||"[]")}catch{return []}};
export const setCart=(v:Item[])=>localStorage.setItem(key,JSON.stringify(v));
