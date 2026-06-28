import { Suspense, useState } from 'react';
import { Link } from 'react-router-dom';
import PageBackground from '../components/three/PageBackground';

const PILLARS = [
  { emoji: '👗', title: 'Handpicked', body: "Every item personally curated by the Pink Halo team. No fast fashion filler — only pieces we'd wear ourselves." },
  { emoji: '✨', title: 'New Weekly', body: 'Fresh arrivals drop every week. Sign up for the newsletter to shop first and never miss a new style.' },
  { emoji: '💛', title: 'Boutique Quality', body: 'Premium fabrics, flattering silhouettes, and styles made to make you feel like the most radiant version of yourself.' },
  { emoji: '🌸', title: 'Wear Your Halo', body: 'Our brand phrase is a daily reminder: you deserve to feel radiant. Every piece helps you do exactly that.' },
];

function PillarCard({ emoji, title, body, index }: { emoji: string; title: string; body: string; index: number }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative rounded-2xl p-6 cursor-default transition-all duration-500 overflow-hidden group"
      style={{
        background: hovered
          ? 'rgba(255,95,160,0.18)'
          : 'rgba(255,255,255,0.04)',
        border: `1px solid ${hovered ? 'rgba(255,100,180,0.5)' : 'rgba(255,255,255,0.08)'}`,
        transform: hovered ? 'translateY(-6px) scale(1.02)' : 'translateY(0) scale(1)',
        boxShadow: hovered ? '0 20px 60px rgba(255,50,130,0.25)' : '0 4px 20px rgba(0,0,0,0.4)',
        transitionDelay: `${index * 40}ms`,
      }}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: 'radial-gradient(circle at 30% 30%, rgba(255,80,160,0.12), transparent 60%)' }} />
      <span className="text-3xl mb-3 block">{emoji}</span>
      <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
      <p className="text-pink-200/70 text-sm leading-relaxed">{body}</p>
    </div>
  );
}

export default function AboutPage() {
  return (
    <div className="relative min-h-screen text-white">
      <Suspense fallback={null}>
        <PageBackground accent="#ff5fa0" />
      </Suspense>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-xs uppercase tracking-[0.35em] text-pink-400 mb-3 font-semibold">Our Story</p>
          <h1 className="text-5xl sm:text-7xl font-serif font-bold mb-5"
            style={{ textShadow: '0 0 40px rgba(255,80,160,0.5)' }}>
            About Pink Halo
          </h1>
          <p className="text-pink-200/80 text-lg max-w-xl mx-auto leading-relaxed">
            A women's clothing and lifestyle boutique built for the woman who knows how to shine.
          </p>
        </div>

        {/* Mission Statement */}
        <div className="rounded-3xl p-8 sm:p-12 mb-12 text-center"
          style={{
            background: 'rgba(255,95,160,0.08)',
            border: '1px solid rgba(255,100,180,0.2)',
            boxShadow: '0 0 60px rgba(255,50,130,0.1)',
          }}>
          <p className="text-xl sm:text-2xl text-pink-100 leading-relaxed font-light italic">
            "We curate feminine, dreamy, and elegant styles that take you from brunch to date night —
            and everywhere in between. Getting dressed should feel like a ritual, not a chore."
          </p>
        </div>

        {/* Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-16">
          {PILLARS.map((p, i) => <PillarCard key={p.title} {...p} index={i} />)}
        </div>

        {/* Halo Points */}
        <div className="rounded-3xl p-8 sm:p-10 mb-12 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(192,132,252,0.15), rgba(255,95,160,0.1))',
            border: '1px solid rgba(192,132,252,0.25)',
          }}>
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-20 blur-3xl"
            style={{ background: 'radial-gradient(circle, #c084fc, transparent)' }} />
          <h2 className="text-2xl font-serif font-bold text-white mb-3">✨ Halo Points Rewards</h2>
          <p className="text-pink-200/80 leading-relaxed mb-5">
            Every purchase earns Halo Points. Redeem them for discounts, early access to new arrivals,
            and exclusive members-only perks. It's our way of saying thank you for being part of our world.
          </p>
          <Link
            to="/rewards"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm transition-all duration-300"
            style={{ background: 'rgba(255,95,160,0.3)', border: '1px solid rgba(255,100,180,0.4)', color: '#fff' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,95,160,0.5)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,95,160,0.3)')}
          >
            Learn about Halo Points →
          </Link>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            to="/shop"
            className="inline-block px-10 py-4 rounded-full font-bold text-white text-lg transition-all duration-300"
            style={{
              background: 'linear-gradient(135deg, #ff5fa0, #c084fc)',
              boxShadow: '0 8px 30px rgba(255,50,130,0.4)',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.05)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 40px rgba(255,50,130,0.6)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 30px rgba(255,50,130,0.4)'; }}
          >
            Shop the Collection
          </Link>
        </div>
      </div>
    </div>
  );
}
