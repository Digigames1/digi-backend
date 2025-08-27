import { getCart, setCart } from "../store/cart";
export default function CartPage(){
  const items=getCart();
  const remove=(i:number)=>{const arr=getCart();arr.splice(i,1);setCart(arr);location.reload();};
  return (
    <div className="container">
      <h2 className="section-title">Your Cart</h2>
      {items.length===0 ? <p>Cart is empty.</p> :
        items.map((it,idx)=>(
          <div className="card" key={idx} style={{display:"flex",alignItems:"center",gap:12}}>
            {it.img && <img src={it.img} alt="" style={{width:80,height:60,objectFit:"cover"}}/>}
            <div style={{flex:1}}>
              <div className="name">{it.name}</div>
              <div className="price">{it.price}</div>
            </div>
            <button className="btn" onClick={()=>remove(idx)}>Remove</button>
          </div>
        ))
      }
    </div>
  );
}
