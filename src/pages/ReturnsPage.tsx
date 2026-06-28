import { Suspense, useState } from 'react';
import { Link } from 'react-router-dom';
import PageBackground from '../components/three/PageBackground';

const STEPS = [
  { n: '01', title: 'Contact Us',     body: 'Email hello@pinkhalo.co with your order number and reason for return. We respond within 1 business day.' },
  { n: '02', title: 'Get Your Label', body: 'We\'ll send a prepaid return shipping label. No hunting for packaging — we keep it simple.' },
  { n: '03', title: 'Ship It Back',   body: 'Pack your item securely and drop it at any UPS location. You\'re all set.' },
  { n: '04', title: 'Get Refunded',   body: 'Once we receive and inspect your return (3–5 days), your refund is processed to the original payment method.' },
];

function StepCard({ n, title, body, index }: { n: string; title: string; body: string; index: number }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex gap-5 rounded-2xl p-6 transition-all duration-400"
      style={{
        background: hovered ? 'rgba(251,113,133,0.12)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${hovered ? 'rgba(251,113,133,0.35)' : 'rgba(255,255,255,0.07)'}`,
        transform: hovered ? 'translateX(6px)' : 'none',
        transitionDelay: `${index * 50}ms`,
      }}
    >
      <div className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg"
        style={{ background: 'linear-gradient(135deg, rgba(251,113,133,0.4), rgba(255,50,130,0.2))', color: '#fb7185' }}>
        {n}
      </div>
      <div>
        <h3 className="text-white font-bold mb-1">{title}</h3>
        <p className="text-pink-200/70 text-sm leading-relaxed">{body}</p>
      </div>
    </div>
  );
}

export default function ReturnsPage() {
  return (
    <div className="relative min-h-screen text-white">
      <Suspense fallback={null}>
        <PageBackground accent="#fb7185" />
      </Suspense>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-20">
        <div className="text-center mb-14">
          <p className="text-xs uppercase tracking-[0.35em] text-pink-400 mb-3 font-semibold">Returns & Exchanges</p>
          <h1 className="text-5xl sm:text-6xl font-serif font-bold mb-4"
            style={{ textShadow: '0 0 40px rgba(251,113,133,0.5)' }}>
            Easy Returns
          </h1>
          <p className="text-pink-200/70">Not in love? We make it simple.</p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-4 mb-12">
          {[
            { icon: '📅', label: '30 Days',    sub: 'To start a return' },
            { icon: '🔄', label: 'Exchange',   sub: 'Any size or style' },
            { icon: '💳', label: 'Full Refund', sub: 'To original payment' },
          ].map(item => (
            <div key={item.label} className="text-center py-6 rounded-2xl transition-all duration-300 hover:scale-105"
              style={{ background: 'rgba(251,113,133,0.1)', border: '1px solid rgba(251,113,133,0.2)' }}>
              <span className="text-3xl block mb-2">{item.icon}</span>
              <p className="text-white font-bold text-sm">{item.label}</p>
              <p className="text-pink-300/70 text-xs mt-0.5">{item.sub}</p>
            </div>
          ))}
        </div>

        {/* Policy summary */}
        <div className="rounded-2xl p-6 mb-8"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h2 className="text-white font-bold mb-3 flex items-center gap-2">📋 Return Policy</h2>
          <p className="text-pink-200/70 text-sm leading-relaxed mb-3">
            Items must be returned within <strong className="text-pink-200">30 days</strong> of delivery:
          </p>
          <ul className="space-y-2">
            {['Unworn and unwashed', 'All tags still attached', 'Original condition — no perfume, stains, or damage', 'Sale items are final sale'].map(item => (
              <li key={item} className="flex items-center gap-2 text-sm text-pink-200/70">
                <span className="text-pink-400">✓</span> {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Steps */}
        <h2 className="text-white font-bold text-xl mb-5">How to Return</h2>
        <div className="space-y-3 mb-10">
          {STEPS.map((s, i) => <StepCard key={s.n} {...s} index={i} />)}
        </div>

        {/* Damaged items */}
        <div className="rounded-2xl p-6 mb-10"
          style={{ background: 'rgba(255,95,160,0.08)', border: '1px solid rgba(255,100,180,0.18)' }}>
          <h3 className="text-white font-bold mb-2">💌 Damaged or Wrong Item?</h3>
          <p className="text-pink-200/70 text-sm leading-relaxed">
            Contact us within 7 days with a photo. We'll send a replacement or full refund —
            no return shipping required. We make it right, always.
          </p>
        </div>

        <div className="text-center">
          <Link to="/contact"
            className="inline-block px-8 py-3.5 rounded-full font-semibold text-white transition-all duration-300"
            style={{ background: 'linear-gradient(135deg, #fb7185, #c084fc)', boxShadow: '0 6px 25px rgba(251,113,133,0.35)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.05)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}>
            Start a Return →
          </Link>
        </div>
      </div>
    </div>
  );
}
