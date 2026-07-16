import { motion } from 'framer-motion';
import { Sparkle } from './brand';

interface AnimatedHeroProps {
  onShopNewArrivals: () => void;
  onShopBestSellers: () => void;
}

const TICKER = ['Free shipping $75+', '30-day easy returns', 'Secure checkout', 'Rewards on every order'];

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export default function AnimatedHero({ onShopNewArrivals, onShopBestSellers }: AnimatedHeroProps) {
  return (
    <>
      <section
        className="relative overflow-hidden"
        style={{
          background:
            'radial-gradient(60% 90% at 78% 20%, #F1DCD9 0%, transparent 60%), radial-gradient(45% 70% at 15% 85%, #F3E6DA 0%, transparent 60%), #F7F0EA',
        }}
      >
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 lg:py-20 grid lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-20 items-center">
          {/* Copy */}
          <div className="text-center lg:text-left order-2 lg:order-1">
            <motion.p
              {...fadeUp}
              transition={{ duration: 0.5 }}
              className="overline text-gold flex items-center justify-center lg:justify-start gap-3.5 whitespace-nowrap"
            >
              <span className="hidden sm:block w-9 h-px bg-gold" aria-hidden="true" />
              Introducing · Collection 01
            </motion.p>
            <motion.h1
              {...fadeUp}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="mt-5 mb-6 font-serif font-medium text-ink leading-[0.98] tracking-tight text-[52px] md:text-7xl xl:text-8xl"
            >
              Made to
              <br />
              <em className="accent-script not-italic text-rose text-[1.06em]">shine.</em>
            </motion.h1>
            <motion.p
              {...fadeUp}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-[15px] text-ink-soft max-w-sm mx-auto lg:mx-0 mb-9"
            >
              Where confidence meets comfort — dreamy sets and soft-glam essentials designed for every version of you.
            </motion.p>
            <motion.div
              {...fadeUp}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="flex flex-col sm:flex-row gap-3.5 justify-center lg:justify-start"
            >
              <button onClick={onShopNewArrivals} className="btn-primary">
                Shop New Arrivals
              </button>
              <button onClick={onShopBestSellers} className="btn-ghost">
                Explore Collections
              </button>
            </motion.div>
          </div>

          {/* Visual: arched frame + halo ring */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7 }}
            className="relative flex justify-center order-1 lg:order-2"
          >
            <Sparkle className="absolute w-6 h-6 text-gold top-[4%] left-[6%]" />
            <Sparkle className="absolute w-4 h-4 text-gold bottom-[12%] right-[2%]" />

            <div
              className="relative w-[min(400px,88%)] overflow-hidden rounded-t-full rounded-b-3xl shadow-[0_40px_90px_rgba(120,60,80,0.18)]"
              style={{ aspectRatio: '4/5.1', background: 'linear-gradient(180deg,#EFD9D7 0%,#E9CCC9 55%,#F2E4DE 100%)' }}
            >
              <img
                src="/products/halo-sculpt-ruched-mini-dress.png"
                alt="Halo Sculpt Ruched Mini Dress — Collection 01"
                className="w-full h-full object-cover object-top"
              />
            </div>

            <svg
              viewBox="0 0 500 160"
              fill="none"
              aria-hidden="true"
              className="absolute -top-[6%] left-1/2 w-[112%] -translate-x-1/2 -rotate-[9deg] pointer-events-none"
            >
              <ellipse cx="250" cy="80" rx="240" ry="66" stroke="#B4707E" strokeWidth="1.3" opacity="0.8" />
              <ellipse cx="250" cy="80" rx="228" ry="60" stroke="#C9A36B" strokeWidth="0.8" opacity="0.45" />
            </svg>

            <div className="absolute bottom-8 -left-1 sm:left-2 lg:-left-4 bg-white px-5 py-4 shadow-[0_20px_50px_rgba(120,60,80,0.16)]">
              <p className="overline text-gold !tracking-[0.24em]">Bestseller</p>
              <p className="font-serif font-medium text-lg text-ink leading-tight mt-0.5">Signature Halo Set</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Ticker strip */}
      <div className="bg-white border-y border-hairline">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap justify-center sm:justify-between gap-x-6 gap-y-2">
          {TICKER.map((item) => (
            <span key={item} className="flex items-center gap-2.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-soft">
              <span className="text-gold" aria-hidden="true">✦</span> {item}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
