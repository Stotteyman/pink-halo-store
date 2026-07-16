import { useMemo, useState } from 'react';
import { ensureGuestSession } from '../lib/session';

export default function ReferPage() {
  const code = useMemo(() => {
    const id = ensureGuestSession() || 'HALO';
    return 'HALO-' + id.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase();
  }, []);
  const link = `${typeof window !== 'undefined' ? window.location.origin : 'https://pinkhalo.co'}/?ref=${code}`;
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard?.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const shareText = encodeURIComponent(`I love Pink Halo ♥ Use my link for $10 off your first order: ${link}`);

  return (
    <section className="max-w-2xl mx-auto px-4 sm:px-6 py-16 lg:py-20 text-center">
      <p className="accent-script text-rose text-2xl">Refer a Friend</p>
      <h1 className="font-serif font-medium text-ink text-4xl md:text-5xl leading-tight mt-2">Give $10, Get $10</h1>
      <p className="text-[15px] text-ink-soft mt-4 max-w-lg mx-auto">
        Share your link with friends. They get <strong className="text-ink">$10 off</strong> their first order over $50, and you get <strong className="text-ink">$10</strong> when they shop.
      </p>

      <div className="mt-10 border border-hairline bg-white p-6 sm:p-8">
        <p className="overline text-gold mb-4">Your referral link</p>
        <div className="flex flex-col sm:flex-row gap-2.5">
          <input readOnly value={link} className="flex-1 min-w-0 px-4 py-3 border border-hairline bg-cream text-sm text-ink outline-none focus:border-rose" />
          <button onClick={copy} className="btn-primary !py-3">{copied ? 'Copied!' : 'Copy Link'}</button>
        </div>
        <div className="flex justify-center gap-2.5 mt-6">
          <a href={`https://wa.me/?text=${shareText}`} target="_blank" rel="noreferrer" className="px-5 py-2.5 border border-hairline text-[10px] font-semibold uppercase tracking-[0.16em] text-ink hover:border-rose hover:text-rose transition-colors">WhatsApp</a>
          <a href={`mailto:?subject=Pink%20Halo&body=${shareText}`} className="px-5 py-2.5 border border-hairline text-[10px] font-semibold uppercase tracking-[0.16em] text-ink hover:border-rose hover:text-rose transition-colors">Email</a>
          <a href={`https://twitter.com/intent/tweet?text=${shareText}`} target="_blank" rel="noreferrer" className="px-5 py-2.5 border border-hairline text-[10px] font-semibold uppercase tracking-[0.16em] text-ink hover:border-rose hover:text-rose transition-colors">Share</a>
        </div>
      </div>

      <p className="text-xs text-ink-soft/80 mt-7">Rewards are applied once your friend's first qualifying order ships. One use per new customer.</p>
    </section>
  );
}
