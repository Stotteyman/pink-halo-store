import { useState } from 'react';
import { Link } from 'react-router-dom';
import { validateEmail, loadSubscribers, saveSubscribers, saveSubscriberToSupabase } from '../lib/newsletter';
import { HaloCrest } from './brand';

const SHOP_LINKS = [
  { label: 'New In', to: '/new' },
  { label: 'Dresses', to: '/category/dresses' },
  { label: 'Tops', to: '/category/tops' },
  { label: 'Bottoms', to: '/category/bottoms' },
  { label: 'Sets', to: '/category/sets' },
  { label: 'Accessories', to: '/category/accessories' },
  { label: 'Sale', to: '/category/sale' },
];

const HELP_LINKS = [
  { label: 'FAQs', to: '/help/faqs' },
  { label: 'Shipping & Delivery', to: '/help/shipping' },
  { label: 'Returns & Exchanges', to: '/help/returns' },
  { label: 'Size Guide', to: '/help/size-guide' },
  { label: 'Track Order', to: '/account' },
  { label: 'Contact Us', to: '/help/contact' },
];

const CLUB_LINKS = [
  { label: 'Rewards', to: '/rewards' },
  { label: 'Refer a Friend', to: '/refer' },
  { label: 'Privacy Policy', to: '/help/privacy' },
  { label: 'Terms of Service', to: '/help/terms' },
];

const SOCIAL = [
  { label: 'Instagram', short: 'IG' },
  { label: 'TikTok', short: 'TT' },
  { label: 'Pinterest', short: 'PN' },
  { label: 'Facebook', short: 'FB' },
  { label: 'YouTube', short: 'YT' },
];

export default function Footer() {
  const year = new Date().getFullYear();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'ok' | 'err'>('idle');

  function subscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!validateEmail(email)) { setStatus('err'); return; }
    const existing = loadSubscribers();
    if (!existing.includes(email.trim())) saveSubscribers([...existing, email.trim()]);
    saveSubscriberToSupabase(email.trim());
    setStatus('ok');
    setEmail('');
  }

  return (
    <footer className="bg-rosewood-dark text-[#CFB4B7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-14 lg:pt-20 pb-12">
        <div className="grid gap-10 lg:gap-14 lg:grid-cols-[1.4fr_1fr_1fr_1.4fr]">
          {/* Brand */}
          <div>
            <HaloCrest className="w-[84px] text-[#E3BFC7] mb-2" />
            <p className="font-serif font-medium text-[#F5E8E2] text-xl tracking-[0.28em]">PINK HALO CO.</p>
            <p className="mt-4 text-[13px] max-w-[250px]">Where confidence meets comfort. Made for you, inspired by you.</p>
            <div className="flex gap-2.5 mt-6">
              {SOCIAL.map((s) => (
                <span
                  key={s.label}
                  title={s.label}
                  className="grid place-items-center w-9 h-9 rounded-full border border-[#5C3B43] text-[11px] font-semibold text-[#E7CBD2] hover:bg-rose hover:border-rose hover:text-white transition-colors cursor-pointer"
                >
                  {s.short}
                </span>
              ))}
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#F5E8E2] mb-5">Shop</h4>
            <ul className="space-y-2.5 list-none m-0 p-0">
              {SHOP_LINKS.map((l) => (
                <li key={l.label}><Link to={l.to} className="text-[13px] hover:text-[#E3BFC7] transition-colors">{l.label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#F5E8E2] mb-5">Help</h4>
            <ul className="space-y-2.5 list-none m-0 p-0">
              {HELP_LINKS.map((l) => (
                <li key={l.label}><Link to={l.to} className="text-[13px] hover:text-[#E3BFC7] transition-colors">{l.label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Club + newsletter */}
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#F5E8E2] mb-5">Stay in the loop</h4>
            <ul className="space-y-2.5 list-none m-0 p-0 mb-7">
              {CLUB_LINKS.map((l) => (
                <li key={l.label}><Link to={l.to} className="text-[13px] hover:text-[#E3BFC7] transition-colors">{l.label}</Link></li>
              ))}
            </ul>
            <form onSubmit={subscribe} className="flex border-b border-[#6B454E]">
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setStatus('idle'); }}
                placeholder="Your email address"
                aria-label="Email address"
                className="flex-1 min-w-0 bg-transparent border-0 outline-none px-1 py-3 text-sm text-[#F5E8E2] placeholder:text-[#8E6F78]"
              />
              <button type="submit" className="px-1 text-[10px] font-bold uppercase tracking-[0.24em] text-[#F5E8E2] hover:text-[#E3BFC7] transition-colors">
                Subscribe
              </button>
            </form>
            {status === 'ok' && <p className="text-xs text-[#E3BFC7] mt-3">You're on the list — welcome to Pink Halo. ✦</p>}
            {status === 'err' && <p className="text-xs text-[#E89AA6] mt-3">Please enter a valid email address.</p>}
          </div>
        </div>

        <div className="border-t border-[#53343C] mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-[#8E6F78]">© {year} Pink Halo Co. All rights reserved.</p>
          <div className="flex items-center gap-2">
            {['VISA', 'MC', 'AMEX', 'PAYPAL', 'APPLE PAY'].map((p) => (
              <span key={p} className="border border-[#53343C] px-2 py-1 text-[9px] font-bold tracking-[0.08em] text-[#CFB4B7]">{p}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
