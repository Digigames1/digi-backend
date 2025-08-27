import { Link } from "react-router-dom";
export default function CategoryCard({icon,title,note,href}:{icon:string;title:string;note:string;href:string;}){
  return (
    <div className="cat-card">
      <Link to={href} className="stretched"></Link>
      <div className="cat-header">
        <span className="cat-icon"><img src={icon} alt={title} width={24} height={24}/></span>
        <div>
          <div className="cat-title">{title}</div>
          <div className="cat-note">{note}</div>
        </div>
      </div>
    </div>
  );
}
