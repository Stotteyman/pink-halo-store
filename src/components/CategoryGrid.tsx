import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface CategoryGridProps {
  onCategorySelect?: (category: string) => void;
}

const collections = [
  { title: 'Halo Lounge', label: 'Luxury comfort', href: '/women' },
  { title: 'Angel Energy', label: 'Coquette & feminine', href: '/women' },
  { title: 'Halo Street', label: 'Streetwear glam', href: '/men' },
  { title: 'Cloud Nine', label: 'Sleepwear & self care', href: '/women' },
  { title: 'Everyday Essentials', label: 'Basics, but better', href: '/women' }
];

export default function CategoryGrid({ onCategorySelect }: CategoryGridProps) {
  const navigate = useNavigate();

  const handleCategoryClick = (href: string) => {
    navigate(href);
    onCategorySelect?.(href.slice(1));
  };

  return (
    <section className="py-16 px-4 bg-pink-50">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.4em] text-pink-500 mb-4">Collection concepts</p>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-pink-900">A polished edit of every halo style.</h2>
          <p className="mt-4 max-w-3xl mx-auto text-pink-700">Inspire your next outfit with soft shades, satin textures, rhinestone details, and everyday confidence.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-5 mb-10">
          {collections.map((collection) => (
            <button
              key={collection.title}
              onClick={() => handleCategoryClick(collection.href)}
              className="group text-left rounded-[2rem] border border-pink-200 bg-white/95 p-6 shadow-[0_20px_50px_rgba(255,132,175,0.12)] transition hover:-translate-y-1"
            >
              <div className="overflow-hidden rounded-[1.8rem] bg-gradient-to-br from-pink-100 via-white to-rose-100 p-6 shadow-inner mb-5">
                <p className="text-2xl font-serif font-bold text-pink-900 leading-tight">{collection.title}</p>
              </div>
              <p className="text-sm uppercase tracking-[0.18em] text-pink-500 mb-3">{collection.label}</p>
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-pink-700">
                View collection
                <svg className="w-4 h-4 text-pink-500 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
