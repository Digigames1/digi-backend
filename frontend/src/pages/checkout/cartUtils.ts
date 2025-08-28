export const money = (value:number, currency:string="USD") =>
  new Intl.NumberFormat("en-US", { style:"currency", currency, maximumFractionDigits:2 }).format(Number.isFinite(value)?value:0);

export const safeMul = (a:any, b:any) => {
  const x = Number.isFinite(+a)?+a:0;
  const y = Number.isFinite(+b)?+b:0;
  return x*y;
};
