import { Suspense, useState } from 'react';
import { Link } from 'react-router-dom';
import PageBackground from '../components/three/PageBackground';

const METHODS = [
  { icon: '🚚', name: 'Standard',   time: '5–7 business days', cost: '$5.99 (Free over $75)' },
  { icon: '⚡', name: 'Expedited',  time: '2–3 business days', cost: '$12.99' },
  { icon: '🌙', name: 'Overnight',  time: 'Next business day',  cost: '$24.99' },
];

const INFO = [
  { title: 'Processing Time', body: 'Orders are processed within 1–2 business days. Orders placed after 2 PM EST or on weekends begin processing the next business day. You\'ll receive a shipping confirmation with tracking as soon as your order ships.' },
  { title: 'Order Tracking', body: 'Once your order ships, you\'ll receive an email with a tracking number. Use it to track your package on the carrier\'s website. If you haven\'t received a tracking email within 3 business days, contact us.' },
  { title: 'P.O. Boxes', body: 'We ship to P.O. Boxes via standard shipping only. Expedited and overnight shipping require a physical street address.' },
  { title: 'International Shipping', body: 'We currently ship within the United States only. International shipping is coming soon — sign up for our newsletter to be the first to know.' },
];

function InfoCard({ title, body, index }: { title: string; body: string; index: number }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="rounded-2xl p-6 transition-all duration-400"
      style={{
        background: hovered ? 'rgba(255,95,160,0.1)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${hovered ? 'rgba(255,100,180,0.3)' : 'rgba(255,255,255,0.07)'}`,
        transform: hovered ? 'translateY(-3px)' : 'none',
        transitionDelay: `${index * 30}ms`,
      }}
    >
      <h3 className="text-white font-bold mb-2">{title}</h3>
      <p className="text-pink-200/70 text-sm leading-relaxed">{body}</p>
    </div>
  );
}

export default function ShippingPage() {
  return (
    <div className="relative min-h-screen text-white">
      <Suspense fallback={null}>
        <PageBackground accent="#f9a8d4" />
      </Suspense>

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-20">
        <div className="text-center mb-14">
          <p className="text-xs uppercase tracking-[0.35em] text-pink-400 mb-3 font-semibold">Shipping & Delivery</p>
          <h1 className="text-5xl sm:text-6xl font-serif font-bold mb-4"
            style={{ textShadow: '0 0 40px rgba(249,168,212,0.5)' }}>
            Shipping Info
          </h1>
          <p className="text-pink-200/70">We want your order to arrive quickly and safely.</p>
        </div>

        {/* Speed highlights */}
        <div className="grid grid-cols-3 gap-4 mb-12">
          {[
            { icon: '🚚', label: 'Free Shipping', sub: 'Orders over $75' },
            { icon: '📦', label: '5–7 Days',       sub: 'Standard shipping' },
            { icon: '⚡', label: '2–3 Days',        sub: 'Expedited option' },
          ].map(item => (
            <div key={item.label} className="text-center py-6 px-3 rounded-2xl transition-all duration-300 hover:scale-105"
              style={{ background: 'rgba(255,95,160,0.1)', border: '1px solid rgba(255,100,180,0.2)' }}>
              <span className="text-3xl block mb-2">{item.icon}</span>
              <p className="text-white font-bold text-sm">{item.label}</p>
              <p className="text-pink-300/70 text-xs mt-0.5">{item.sub}</p>
            </div>
          ))}
        </div>

        {/* Shipping method table */}
        <div className="rounded-2xl overflow-hidden mb-10"
          style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="px-5 py-3 text-xs uppercase tracking-wider font-semibold text-pink-400 grid grid-cols-3"
            style={{ background: 'rgba(255,95,160,0.12)' }}>
            <span>Method</span><span>Timeframe</span><span>Cost</span>
          </div>
          {METHODS.map((m, i) => (
            <div key={m.name}
              className="px-5 py-4 grid grid-cols-3 items-center text-sm transition-all duration-200 hover:bg-white/[0.04]"
              style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
              <span className="text-white font-medium">{m.icon} {m.name}</span>
              <span className="text-pink-200/70">{m.time}</span>
              <span className="text-pink-200/70">{m.cost}</span>
            </div>
          ))}
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
          {INFO.map((item, i) => <InfoCard key={item.title} {...item} index={i} />)}
        </div>

        <div className="text-center">
          <Link to="/contact"
            className="inline-block px-8 py-3.5 rounded-full font-semibold text-white transition-all duration-300"
            style={{ background: 'linear-gradient(135deg, #ff5fa0, #c084fc)', boxShadow: '0 6px 25px rgba(255,100,130,0.3)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.05)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}>
            Questions? Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
}
