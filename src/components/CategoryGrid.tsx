import { useNavigate } from 'react-router-dom';
import { getCategories } from '../lib/products';

const EMOJI: Record<string, string> = {
  Dresses: '👗',
  Tops: '👚',
  Lounge: '🧸',
  Accessories: '💍',
  Sale: '🏷️',
};

export default function CategoryGrid() {
  const navigate = useNavigate();
  const categories = getCategories();

  return (
    <section className="py-14 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-serif font-bold text-pink-900 text-center mb-8">
          Shop by category
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => navigate(`/category/${category.toLowerCase()}`)}
              className="rounded-3xl border border-pink-100 bg-pink-50 p-6 text-center transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="text-3xl mb-3">{EMOJI[category] ?? '✨'}</div>
              <p className="font-semibold text-pink-900">{category}</p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
