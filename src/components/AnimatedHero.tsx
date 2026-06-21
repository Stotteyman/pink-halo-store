import { motion } from 'framer-motion';
import FloatingParticles from './FloatingParticles';

interface AnimatedHeroProps {
  onShopWomen: () => void;
  onExploreCollections: () => void;
}

const heroFeatures = [
  'Soft glam editorial styling',
  'Signature halo details',
  'Luxe basics with sparkle',
  'Everyday confidence pieces'
];

export default function AnimatedHero({ onShopWomen, onExploreCollections }: AnimatedHeroProps) {
  return (
    <section className="relative overflow-hidden bg-pink-50 pb-24 pt-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.95),transparent_40%),radial-gradient(circle_at_30%_20%,rgba(255,153,200,0.2),transparent_25%),linear-gradient(180deg,#fff7f8_0%,#ffe9ee_100%)]" />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-14 left-10 h-72 w-72 rounded-full bg-pink-300/25 blur-3xl" />
        <div className="absolute top-24 right-16 h-60 w-60 rounded-full bg-rose-200/25 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-amber-200/20 blur-3xl" />
      </div>

      <FloatingParticles count={42} className="opacity-40 mix-blend-screen" />

      <div className="relative z-10 container mx-auto px-4">
        <div className="grid gap-12 lg:grid-cols-[1.45fr_0.95fr] items-start">
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-4 text-center lg:text-left"
            >
              <p className="text-sm uppercase tracking-[0.35em] text-pink-600">Pink Halo Co.</p>
              <h1 className="text-5xl md:text-6xl xl:text-7xl font-serif font-bold text-pink-900 leading-tight">
                Pink Halo Co.
              </h1>
              <p className="max-w-3xl text-lg md:text-xl text-pink-700 leading-relaxed">
                Beauty. Confidence. You. Now in every fit. A moodboard-inspired edit of soft glam looks, luxe essentials, and feminine pieces designed to shine.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
            >
              {heroFeatures.map((feature) => (
                <div key={feature} className="rounded-[2rem] border border-pink-200 bg-white/95 px-5 py-4 text-sm font-medium text-pink-700 shadow-sm">
                  {feature}
                </div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex flex-col sm:flex-row flex-wrap gap-4"
            >
              <button
                onClick={onShopWomen}
                className="px-8 py-3 luxury-cta-gradient text-white font-semibold rounded-full shadow-xl hover:shadow-2xl"
              >
                Shop Women’s Collection
              </button>
              <button
                onClick={onExploreCollections}
                className="px-8 py-3 border-2 border-pink-200 text-pink-800 bg-white/90 font-semibold rounded-full hover:bg-white"
              >
                Explore All Collections
              </button>
            </motion.div>
          </div>

          <aside className="rounded-[2.5rem] border border-pink-200 bg-white/95 p-8 shadow-[0_34px_120px_rgba(255,181,206,0.12)]">
            <div className="inline-flex items-center rounded-full border border-pink-200 bg-pink-50 px-4 py-2 text-xs uppercase tracking-[0.35em] text-pink-600 mb-5">
              Brand Vibe
            </div>
            <h2 className="text-3xl font-serif font-bold text-pink-900">Soft glam. Feminine. Confident.</h2>
            <p className="mt-5 text-sm text-pink-700 leading-relaxed">
              Elevate your everyday wardrobe with oversized hoodies, satin loungewear, rhinestone details, and a signature halo feel.
            </p>
            <div className="mt-8 grid gap-3">
              {['Soft Glam', 'Feminine', 'Confident', 'Luxury Everyday', 'Made to Shine'].map((item) => (
                <div key={item} className="rounded-3xl border border-pink-100 bg-pink-50/90 px-4 py-4 text-sm text-pink-700 shadow-sm">
                  {item}
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
