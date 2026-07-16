import { Link } from 'react-router-dom';

const EARN = [
  { pts: '+100', label: 'Create an account', icon: '★' },
  { pts: '1 pt / $1', label: 'Every order you place', icon: '✧' },
  { pts: '+50', label: 'Follow us on social', icon: '♥' },
  { pts: '+250', label: 'Refer a friend', icon: '✦' },
];

const REDEEM = [
  { pts: '500 pts', reward: '$5 off' },
  { pts: '1,000 pts', reward: '$12 off' },
  { pts: '2,000 pts', reward: '$25 off' },
];

export default function RewardsPage() {
  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 py-14 lg:py-20">
      <div className="text-center mb-14">
        <p className="accent-script text-rose text-2xl">Halo Rewards</p>
        <h1 className="font-serif font-medium text-ink text-4xl md:text-5xl leading-tight mt-2">Earn points. Get rewarded.</h1>
        <p className="text-[15px] text-ink-soft mt-4 max-w-xl mx-auto">Join Halo Rewards free and earn points every time you shop, share, and refer friends. Redeem them for money off your next order.</p>
        <Link to="/account" className="btn-primary mt-8">Join &amp; Start Earning</Link>
      </div>

      <h2 className="text-[11px] font-bold uppercase tracking-[0.24em] text-ink mb-5">Ways to earn</h2>
      <div className="grid sm:grid-cols-2 gap-3.5 mb-14">
        {EARN.map((e) => (
          <div key={e.label} className="flex items-center gap-4 border border-hairline bg-white p-5">
            <span className="grid place-items-center w-12 h-12 rounded-full bg-blush text-rose text-xl flex-shrink-0">{e.icon}</span>
            <div>
              <p className="font-serif text-lg text-ink leading-snug">{e.label}</p>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-rose mt-0.5">{e.pts} points</p>
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-[11px] font-bold uppercase tracking-[0.24em] text-ink mb-5">Redeem your points</h2>
      <div className="grid grid-cols-3 gap-3.5">
        {REDEEM.map((r) => (
          <div key={r.pts} className="text-center border border-hairline bg-blush p-6">
            <p className="font-serif font-medium text-2xl md:text-3xl text-rose">{r.reward}</p>
            <p className="text-[10px] text-ink-soft mt-1.5 uppercase tracking-[0.18em]">{r.pts}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
