import categories from '../data/categories';
import featuredCards from '../data/featuredCards';
import CategoryCard from './CategoryCard';

export default function HomePage() {
  return (
    <div>
      <section>
        <h2 className="section-title">Shop by Category</h2>
        <div className="category-grid">
          {categories.map((cat) => (
            <CategoryCard key={cat.title} category={cat} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="section-title">Featured Gift Cards</h2>
        <div className="card-row">
          {featuredCards.map((card) => (
            <div key={card.title} className="card">
              <img src={card.image} alt={card.title} loading="lazy" />
              <h3>{card.title}</h3>
              <p>${card.price.toFixed(2)}</p>
              <p>Rating: {card.rating}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
