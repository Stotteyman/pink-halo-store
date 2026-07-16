import { Link, useNavigate } from 'react-router-dom';

type Tile = { label: string; to: string; image: string };

const TILES: Tile[] = [
  { label: 'New In', to: '/new', image: '/products/pink-performance-curve-set.png' },
  { label: 'Dresses', to: '/category/dresses', image: '/products/halo-sculpt-ruched-mini-dress.png' },
  { label: 'Tops', to: '/category/tops', image: '/products/pretty-girls-love-pink-halo-tee.png' },
  { label: 'Bottoms', to: '/category/bottoms', image: '/products/wild-halo-leopard-track-set.png' },
  { label: 'Sets', to: '/category/sets', image: '/products/signature-halo-sweat-set.png' },
  { label: 'Accessories', to: '/category/accessories', image: '/products/soft-halo-tee-short-set.png' },
];

export default function CategoryGrid() {
  const navigate = useNavigate();

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
          {TILES.map((tile) => (
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
