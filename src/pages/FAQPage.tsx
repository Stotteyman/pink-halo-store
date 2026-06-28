import { Suspense, useState } from 'react';
import { Link } from 'react-router-dom';
import PageBackground from '../components/three/PageBackground';

const FAQS = [
  { q: 'How long does shipping take?', a: 'Standard shipping takes 5–7 business days. Expedited (2–3 days) is available at checkout. Orders over $75 ship free.' },
  { q: 'What is your return policy?', a: 'We accept returns within 30 days of delivery. Items must be unworn, unwashed, and in original packaging with tags attached. Sale items are final sale.' },
  { q: 'How do I exchange for a different size?', a: 'Return your item for a refund and place a new order in the correct size. This ensures you get your item before it sells out.' },
  { q: 'Do you offer free shipping?', a: 'Yes! All orders over $75 ship free. Use code HALO10 for 10% off your first order.' },
  { q: 'How do Halo Points work?', a: 'Earn 1 Halo Point per $1 spent. Redeem for discounts, free shipping, and exclusive perks. Create a free account to start.' },
  { q: 'Do you restock sold-out items?', a: 'Some items are restocked. Sign up for notifications on any product page to be alerted when it returns.' },
  { q: 'Are your sizing measurements accurate?', a: 'Yes — detailed size charts live on every product page. Check our Size Guide for general measurements.' },
  { q: 'Can I change or cancel my order?', a: 'Orders can be modified or cancelled within 1 hour of placement. Contact hello@pinkhalo.co immediately.' },
  { q: 'Do you ship internationally?', a: 'We currently ship within the US. International shipping is coming soon — sign up for the newsletter to be notified.' },
];

function FAQItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={() => setOpen(o => !o)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="cursor-pointer rounded-2xl mb-3 overflow-hidden transition-all duration-400"
      style={{
        background: open
          ? 'rgba(255,95,160,0.12)'
          : hovered ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${open ? 'rgba(255,100,180,0.35)' : 'rgba(255,255,255,0.07)'}`,
        boxShadow: open ? '0 8px 30px rgba(255,50,130,0.15)' : 'none',
        transitionDelay: `${index * 20}ms`,
      }}
    >
      <div className="flex items-center justify-between px-6 py-5 gap-4">
        <span className="text-white font-medium text-sm sm:text-base leading-snug">{q}</span>
        <span
          className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-lg transition-all duration-300"
          style={{
            background: open ? 'rgba(255,95,160,0.35)' : 'rgba(255,255,255,0.08)',
            color: open ? '#ff80c0' : '#a070a0',
            transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
          }}
        >
          +
        </span>
      </div>
      {open && (
        <div className="px-6 pb-5">
          <p className="text-pink-200/75 text-sm leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
  return (
    <div className="relative min-h-screen text-white">
      <Suspense fallback={null}>
        <PageBackground accent="#fbbf24" />
      </Suspense>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.35em] text-pink-400 mb-3 font-semibold">Quick Answers</p>
          <h1 className="text-5xl sm:text-6xl font-serif font-bold mb-4"
            style={{ textShadow: '0 0 40px rgba(251,191,36,0.4)' }}>
            FAQ
          </h1>
          <p className="text-pink-200/70">
            Don't see your question?{' '}
            <Link to="/contact" className="text-pink-300 hover:text-pink-100 underline underline-offset-2">Contact us</Link>.
          </p>
        </div>

        <div>
          {FAQS.map((faq, i) => <FAQItem key={i} {...faq} index={i} />)}
        </div>

        <div className="text-center mt-10">
          <Link to="/shop"
            className="inline-block px-8 py-3.5 rounded-full font-semibold text-white transition-all duration-300"
            style={{ background: 'linear-gradient(135deg, #ff5fa0, #fbbf24)', boxShadow: '0 6px 25px rgba(255,100,50,0.3)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.05)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}>
            Back to Shopping ✨
          </Link>
        </div>
      </div>
    </div>
  );
}
