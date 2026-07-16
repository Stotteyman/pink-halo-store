import { useState } from 'react';
import { validateEmail, loadSubscribers, saveSubscribers, saveSubscriberToSupabase } from '../lib/newsletter';

/** Blush newsletter band — "the inner circle" signup on the landing page. */
export default function NewsletterBand() {
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
    <section className="bg-blush py-16 lg:py-24 text-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <p className="overline text-gold">The inner circle</p>
        <h2 className="font-serif font-medium text-ink text-4xl md:text-[52px] mt-4 mb-3 leading-none">
          Get the drop <em className="italic text-rose">first.</em>
        </h2>
        <p className="text-[15px] text-ink-soft max-w-md mx-auto mb-9">
          New arrivals, private sales and styling notes — straight to your inbox.
        </p>
        <form onSubmit={subscribe} className="flex max-w-md mx-auto border-b border-ink">
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setStatus('idle'); }}
            placeholder="Your email address"
            aria-label="Email address"
            className="flex-1 min-w-0 bg-transparent border-0 outline-none px-1 py-3.5 text-[15px] text-ink placeholder:text-ink-soft/70"
          />
          <button type="submit" className="px-1 text-[11px] font-bold uppercase tracking-[0.24em] text-ink hover:text-rose transition-colors">
            Subscribe
          </button>
        </form>
        {status === 'ok' && <p className="text-[13px] text-rose mt-4">You're on the list — welcome to the inner circle. ✦</p>}
        {status === 'err' && <p className="text-[13px] text-rose-deep mt-4">Please enter a valid email address.</p>}
      </div>
    </section>
  );
}
