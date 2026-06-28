import { useState } from 'react';

const FAQS = [
  {
    q: 'How long does shipping take?',
    a: 'Standard shipping takes 5–7 business days. Expedited shipping (2–3 business days) is available at checkout. Orders over $75 ship free.',
  },
  {
    q: 'What is your return policy?',
    a: 'We accept returns within 30 days of delivery. Items must be unworn, unwashed, and in original packaging with tags attached. Sale items are final sale.',
  },
  {
    q: 'How do I exchange for a different size?',
    a: 'To exchange, return your item for a refund and place a new order in the correct size. This ensures you get the item before it sells out.',
  },
  {
    q: 'Do you offer free shipping?',
    a: 'Yes! All orders over $75 qualify for free standard shipping. Sign up for our email list and use code HALO10 to get 10% off your first order.',
  },
  {
    q: 'How do Halo Points work?',
    a: 'Earn 1 Halo Point for every $1 spent. Points can be redeemed for discounts, free shipping, and exclusive perks. Sign up for a free account to start earning.',
  },
  {
    q: 'Do you restock sold-out items?',
    a: 'Some items are restocked, while others are limited releases. Sign up for email notifications on any product page to be alerted when it returns.',
  },
  {
    q: 'Are your sizing measurements accurate?',
    a: 'Yes — we include detailed size charts on every product page. Check our Size Guide for general measurements or contact us if you need help choosing.',
  },
  {
    q: 'Can I change or cancel my order?',
    a: 'Orders can be modified or cancelled within 1 hour of placement. After that, the order goes to fulfillment. Contact us immediately at hello@pinkhalo.co.',
  },
  {
    q: 'Do you ship internationally?',
    a: 'We currently ship within the United States. International shipping is coming soon — sign up for our newsletter to be notified when it launches.',
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-pink-100 last:border-0">
      <button
        className="w-full text-left py-4 flex justify-between items-center gap-4 group"
        onClick={() => setOpen(o => !o)}
      >
        <span className="font-medium text-pink-900 group-hover:text-pink-700 transition text-sm sm:text-base">{q}</span>
        <span className="text-pink-400 text-xl shrink-0">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <p className="pb-4 text-pink-600 text-sm leading-relaxed">{a}</p>
      )}
    </div>
  );
}

export default function FAQPage() {
  return (
    <div className="flex-1 py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <p className="text-xs uppercase tracking-widest text-pink-400 mb-2">Quick Answers</p>
        <h1 className="text-4xl sm:text-5xl font-serif font-bold text-pink-900 mb-4">FAQ</h1>
        <p className="text-pink-600 mb-10">
          Everything you need to know about shopping at Pink Halo. Don't see your question?{' '}
          <a href="/contact" className="text-pink-800 font-medium hover:underline">Contact us</a>.
        </p>

        <div className="bg-white rounded-2xl border border-pink-100 px-6 py-2">
          {FAQS.map((faq, i) => (
            <FAQItem key={i} q={faq.q} a={faq.a} />
          ))}
        </div>
      </div>
    </div>
  );
}
