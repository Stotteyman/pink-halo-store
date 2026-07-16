import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchCategories, fetchSettings } from '../lib/supabase';

type Tile = { label: string; to: string; image: string };

// Fallbacks when a category has no photo set in Admin → Categories
const DEFAULT_IMAGES: Record<string, string> = {
  'new in': '/products/pink-performance-curve-set.png',
  dresses: '/products/halo-sculpt-ruched-mini-dress.png',
  tops: '/products/pretty-girls-love-pink-halo-tee.png',
  bottoms: '/products/wild-halo-leopard-track-set.png',
  sets: '/products/signature-halo-sweat-set.png',
  lounge: '/products/signature-halo-sweat-set.png',
  accessories: '/products/soft-halo-tee-short-set.png',
};

const FALLBACK_TILES: Tile[] = [
  { label: 'New In', to: '/new', image: DEFAULT_IMAGES['new in'] },
  { label: 'Dresses', to: '/category/dresses', image: DEFAULT_IMAGES.dresses },
  { label: 'Tops', to: '/category/tops', image: DEFAULT_IMAGES.tops },
  { label: 'Bottoms', to: '/category/bottoms', image: DEFAULT_IMAGES.bottoms },
  { label: 'Sets', to: '/category/sets', image: DEFAULT_IMAGES.sets },
  { label: 'Accessories', to: '/category/accessories', image: DEFAULT_IMAGES.accessories },
];

export default function CategoryGrid() {
  const navigate = useNavigate();
  const [tiles, setTiles] = useState<Tile[]>(FALLBACK_TILES);

  useEffect(() => {
    Promise.all([fetchCategories(), fetchSettings(['home_new_in_image'])])
      .then(([catData, settingsData]) => {
        const categories = (catData.categories || []).filter(c => c.name.toLowerCase() !== 'sale');
        if (categories.length === 0) return;
        const newInImage = typeof settingsData.settings?.home_new_in_image === 'string' && settingsData.settings.home_new_in_image
          ? String(settingsData.settings.home_new_in_image)
          : DEFAULT_IMAGES['new in'];
        setTiles([
          { label: 'New In', to: '/new', image: newInImage },
          ...categories.map(category => ({
            label: category.name,
            to: `/category/${category.slug}`,
            image: category.image_url || DEFAULT_IMAGES[category.name.toLowerCase()] || DEFAULT_IMAGES['new in'],
          })),
        ]);
      })
      .catch(() => undefined); // keep fallback tiles
  }, []);

  return (
    <section className="bg-cream py-14 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-end justify-between gap-5 mb-8 lg:mb-12">
          <div>
            <p className="overline text-gold mb-3">Curated for you</p>
            <h2 className="font-serif font-medium text-ink leading-none text-[30px] md:text-5xl">
              Shop by <em className="italic text-rose">collection</em>
            </h2>
          </div>
          <Link to="/shop" className="link-more text-ink">
            View all
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3.5">
          {tiles.map((tile) => (
            <button
              key={tile.label}
              onClick={() => navigate(tile.to)}
              className="group relative overflow-hidden bg-shell text-left"
              style={{ aspectRatio: '3/4.1' }}
            >
              <img
                src={tile.image}
                alt={tile.label}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.2,0.7,0.2,1)] group-hover:scale-105"
              />
              <span
                aria-hidden="true"
                className="absolute inset-0"
                style={{ background: 'linear-gradient(180deg, transparent 55%, rgba(48,22,29,0.55))' }}
              />
              <span className="absolute left-4 right-4 bottom-3.5 z-[2] flex items-center justify-between text-white">
                <span className="font-serif text-lg">{tile.label}</span>
                <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
