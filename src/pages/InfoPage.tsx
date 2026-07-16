import { useParams } from 'react-router-dom';
import NotFound from '../components/NotFound';

type Block = { h?: string; p: string };
const CONTENT: Record<string, { title: string; blocks: Block[] }> = {
  faqs: {
    title: 'Frequently Asked Questions',
    blocks: [
      { h: 'Do I need an account to order?', p: 'No — you can check out as a guest in just a few clicks. Creating a free account lets you track orders and earn Halo Rewards points.' },
      { h: 'How long does shipping take?', p: 'Most orders ship within 1–2 business days and arrive in 3–7 business days. You will receive a tracking link by email once your order ships.' },
      { h: 'What is your return policy?', p: 'We offer hassle-free returns within 30 days of delivery on unworn items with tags attached.' },
      { h: 'How do I use a discount code?', p: 'Enter your code at checkout and the discount will be applied to your order total before payment.' },
    ],
  },
  shipping: {
    title: 'Shipping & Delivery',
    blocks: [
      { h: 'Free shipping', p: 'Enjoy free standard shipping on all orders over $75. Orders under $75 ship at a flat rate calculated at checkout.' },
      { h: 'Processing time', p: 'Orders are processed within 1–2 business days. You will get an email with tracking as soon as your order is on its way.' },
      { h: 'Delivery estimates', p: 'Standard delivery takes 3–7 business days within the US after dispatch. International times vary by destination.' },
    ],
  },
  returns: {
    title: 'Returns & Exchanges',
    blocks: [
      { h: '30-day returns', p: 'If something is not quite right, you can return unworn items with tags within 30 days of delivery for a refund or exchange.' },
      { h: 'How to start a return', p: 'Contact us with your order number and we will send you return instructions and a prepaid label where eligible.' },
      { h: 'Refunds', p: 'Refunds are issued to your original payment method within 5–7 business days of us receiving your return.' },
    ],
  },
  'size-guide': {
    title: 'Size Guide',
    blocks: [
      { h: 'Finding your fit', p: 'Our pieces run true to size. If you are between sizes or prefer a relaxed fit, we recommend sizing up.' },
      { h: 'Tops & Dresses (US)', p: 'XS: 0–2 · S: 4–6 · M: 8–10 · L: 12–14 · XL: 16–18.' },
      { h: 'Bottoms (waist, inches)', p: 'XS: 24–25 · S: 26–27 · M: 28–30 · L: 31–33 · XL: 34–36.' },
      { h: 'Need help?', p: 'Reach out any time and we will help you find your perfect size.' },
    ],
  },
  contact: {
    title: 'Contact Us',
    blocks: [
      { h: 'We would love to hear from you', p: 'Questions about an order, sizing, or a product? Email us at hello@pinkhalo.co and we typically reply within one business day.' },
      { h: 'Customer care hours', p: 'Monday–Friday, 9am–5pm. Messages sent over the weekend are answered first thing Monday.' },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    blocks: [
      { p: 'This summary explains how Pink Halo handles your information. We collect only what we need to process your orders, provide support, and improve your shopping experience.' },
      { h: 'What we collect', p: 'Contact and shipping details you provide at checkout, and basic usage data to keep the store running smoothly. Payments are processed securely by Stripe — we never store full card numbers.' },
      { h: 'How we use it', p: 'To fulfill orders, send order updates, and — only if you opt in — occasional news about new drops and sales. You can unsubscribe at any time.' },
      { h: 'Your choices', p: 'You may request access to or deletion of your data by contacting hello@pinkhalo.co.' },
    ],
  },
  terms: {
    title: 'Terms of Service',
    blocks: [
      { p: 'By using pinkhalo.co and placing an order, you agree to these terms.' },
      { h: 'Orders & pricing', p: 'All prices are in USD. We reserve the right to correct pricing errors and to cancel or refund orders where necessary.' },
      { h: 'Products', p: 'We work to display colors and details accurately, but slight variation may occur between screens and the physical item.' },
      { h: 'Contact', p: 'Questions about these terms? Email hello@pinkhalo.co.' },
    ],
  },
};

export default function InfoPage() {
  const { slug } = useParams<{ slug: string }>();
  const data = slug ? CONTENT[slug] : undefined;
  if (!data) return <NotFound />;

  return (
    <section className="max-w-3xl mx-auto px-4 sm:px-6 py-14 lg:py-20">
      <p className="overline text-gold mb-3">Pink Halo Co.</p>
      <h1 className="font-serif font-medium text-ink text-4xl md:text-5xl leading-tight mb-10">{data.title}</h1>
      <div className="space-y-7">
        {data.blocks.map((b, i) => (
          <div key={i}>
            {b.h && <h2 className="font-serif font-medium text-xl text-ink mb-1.5">{b.h}</h2>}
            <p className="text-[15px] text-ink-soft leading-relaxed">{b.p}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
