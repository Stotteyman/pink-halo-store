const BADGES = [
  {
    title: 'Fast Shipping',
    body: 'Quick delivery to your door',
    icon: 'M3 7h11v8H3zM14 10h4l3 3v2h-7zM7 18a2 2 0 11-4 0 2 2 0 014 0zm12 0a2 2 0 11-4 0 2 2 0 014 0z',
  },
  {
    title: 'Easy Returns',
    body: '30-day return policy',
    icon: 'M4 4v6h6M20 20v-6h-6M20 8a8 8 0 00-14.9-2M4 16a8 8 0 0014.9 2',
  },
  {
    title: 'Secure Checkout',
    body: '100% secure payments',
    icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
  },
  {
    title: 'Made With Love',
    body: 'Designed for every you',
    icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
  },
];

export default function TrustBadges() {
  return (
    <section className="bg-white border-y border-hairline">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-2 lg:grid-cols-4">
        {BADGES.map((b, i) => (
          <div
            key={b.title}
            className={`flex flex-col gap-2 py-7 lg:py-9 px-4 lg:px-6 border-hairline ${i > 0 ? 'lg:border-l' : ''} ${i % 2 === 1 ? 'border-l lg:border-l' : ''} ${i >= 2 ? 'border-t lg:border-t-0' : ''}`}
          >
            <svg className="w-[22px] h-[22px] text-rose" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.4} d={b.icon} />
            </svg>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink">{b.title}</p>
            <p className="text-[13px] text-ink-soft leading-snug">{b.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
