import { Link } from 'react-router-dom';
import type { Category } from '../data/categories';

interface Props {
  category: Category;
}

export default function CategoryCard({ category }: Props) {
  return (
    <Link to={category.link} className="category-card">
      <img src={category.icon} alt={category.title} loading="lazy" />
      {category.title}
    </Link>
  );
}
