import { motion } from 'framer-motion';

interface AnimatedHeroProps {
  onShopNow: () => void;
  onExploreCollections: () => void;
}

export default function AnimatedHero({ onShopNow, onExploreCollections }: AnimatedHeroProps) {
  return (
    <section className="relative overflow-hidden bg-pink-50">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.95),transparent_45%),linear-gradient(180deg,#fff7f8_0%,#ffe9ee_100%)]" />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-10 left-8 h-56 w-56 rounded-full bg-pink-300/20 blur-3xl" />
        <div className="absolute top-16 right-10 h-48 w-48 rounded-full bg-rose-200/20 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-20 sm:py-24 text-center">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-xs uppercase tracking-[0.4em] text-pink-500 mb-4"
        >
          Wear Your Halo
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="text-5xl md:text-6xl font-serif font-bold text-pink-900 leading-tight"
        >
          Pink Halo
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-4 text-lg text-pink-700 max-w-xl mx-auto"
        >
          Feminine, soft-glam pieces for everyday confidence. Simple to shop, easy to love.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-8 flex flex-col sm:flex-row gap-3 justify-center"
        >
          <button
            onClick={onShopNow}
            className="px-8 py-3 luxury-cta-gradient text-white font-semibold rounded-full shadow-lg hover:shadow-xl"
          >
            Shop the collection
          </button>
          <button
            onClick={onExploreCollections}
            className="px-8 py-3 border-2 border-pink-200 text-pink-800 bg-white/90 font-semibold rounded-full hover:bg-white"
          >
            Browse categories
          </button>
        </motion.div>
      </div>
    </section>
  );
}
