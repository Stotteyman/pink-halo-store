import { Suspense, useState } from 'react';
import { Link } from 'react-router-dom';
import PageBackground from '../components/three/PageBackground';

const TOPS = [
  { size: 'XS', chest: '32–33"', waist: '24–25"', hips: '34–35"', us: '0–2' },
  { size: 'S',  chest: '34–35"', waist: '26–27"', hips: '36–37"', us: '4–6' },
  { size: 'M',  chest: '36–37"', waist: '28–29"', hips: '38–39"', us: '8–10' },
  { size: 'L',  chest: '38–40"', waist: '30–32"', hips: '40–42"', us: '12–14' },
  { size: 'XL', chest: '41–43"', waist: '33–35"', hips: '43–45"', us: '16–18' },
];
const DRESSES = [
  { size: 'XS', length: '50"', bust: '32–33"', waist: '24–25"', us: '0–2' },
  { size: 'S',  length: '51"', bust: '34–35"', waist: '26–27"', us: '4–6' },
  { size: 'M',  length: '52"', bust: '36–37"', waist: '28–29"', us: '8–10' },
  { size: 'L',  length: '53"', bust: '38–40"', waist: '30–32"', us: '12–14' },
  { size: 'XL', length: '54"', bust: '41–43"', waist: '33–35"', us: '16–18' },
];

function SizeTable({ headers, rows }: { headers: string[]; rows: Record<string,string>[] }) {
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className={`grid px-5 py-3 text-xs uppercase tracking-wider font-semibold text-pink-400`}
        style={{ gridTemplateColumns: `repeat(${headers.length}, 1fr)`, background: 'rgba(255,95,160,0.12)' }}>
        {headers.map(h => <span key={h}>{h}</span>)}
      </div>
      {rows.map((row, i) => (
        <div key={i}
          onMouseEnter={() => setHoveredRow(i)}
          onMouseLeave={() => setHoveredRow(null)}
          className={`grid px-5 py-4 text-sm transition-all duration-200 cursor-default`}
          style={{
            gridTemplateColumns: `repeat(${headers.length}, 1fr)`,
            borderTop: '1px solid rgba(255,255,255,0.05)',
            background: hoveredRow === i ? 'rgba(255,95,160,0.1)' : 'transparent',
          }}>
          {Object.values(row).map((v, j) => (
            <span key={j} className={j === 0 ? 'font-bold text-pink-300' : 'text-pink-200/70'}>{v}</span>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function SizeGuidePage() {
  const [activeTab, setActiveTab] = useState<'tops' | 'dresses'>('tops');

  return (
    <div className="relative min-h-screen text-white">
      <Suspense fallback={null}>
        <PageBackground accent="#c084fc" />
      </Suspense>

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-20">
        <div className="text-center mb-14">
          <p className="text-xs uppercase tracking-[0.35em] text-pink-400 mb-3 font-semibold">Find Your Fit</p>
          <h1 className="text-5xl sm:text-6xl font-serif font-bold mb-4"
            style={{ textShadow: '0 0 40px rgba(192,132,252,0.5)' }}>
            Size Guide
          </h1>
          <p className="text-pink-200/70">All measurements in inches. When between sizes, size up for relaxed, down for fitted.</p>
        </div>

        {/* How to measure */}
        <div className="grid grid-cols-3 gap-4 mb-12">
          {[
            { icon: '📏', title: 'Bust', desc: 'Around the fullest part of your chest, tape parallel to floor' },
            { icon: '〰️', title: 'Waist', desc: 'Narrowest part of your waist, about 1" above belly button' },
            { icon: '🌸', title: 'Hips', desc: '7–9 inches below your natural waist, around fullest part' },
          ].map(item => (
            <div key={item.title} className="rounded-2xl p-5 text-center transition-all duration-300 hover:scale-105 hover:-translate-y-1"
              style={{ background: 'rgba(192,132,252,0.1)', border: '1px solid rgba(192,132,252,0.2)' }}>
              <span className="text-3xl block mb-2">{item.icon}</span>
              <p className="text-white font-bold text-sm mb-1">{item.title}</p>
              <p className="text-pink-200/60 text-xs leading-snug">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 p-1 rounded-2xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
          {(['tops', 'dresses'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="flex-1 py-3 rounded-xl font-semibold text-sm transition-all duration-300 capitalize"
              style={{
                background: activeTab === tab
                  ? 'linear-gradient(135deg, rgba(255,95,160,0.5), rgba(192,132,252,0.4))'
                  : 'transparent',
                color: activeTab === tab ? '#fff' : 'rgba(255,200,220,0.6)',
                border: activeTab === tab ? '1px solid rgba(255,100,180,0.4)' : '1px solid transparent',
              }}>
              {tab === 'tops' ? '👕 Tops & Lounge' : '👗 Dresses'}
            </button>
          ))}
        </div>

        {activeTab === 'tops' && (
          <SizeTable
            headers={['Size', 'Chest', 'Waist', 'Hips', 'US Size']}
            rows={TOPS}
          />
        )}
        {activeTab === 'dresses' && (
          <SizeTable
            headers={['Size', 'Length', 'Bust', 'Waist', 'US Size']}
            rows={DRESSES}
          />
        )}

        <div className="text-center mt-12">
          <p className="text-pink-200/60 text-sm mb-4">Still not sure? We're happy to help you find the perfect fit.</p>
          <Link to="/contact"
            className="inline-block px-8 py-3.5 rounded-full font-semibold text-white transition-all duration-300"
            style={{ background: 'linear-gradient(135deg, #c084fc, #ff5fa0)', boxShadow: '0 6px 25px rgba(192,132,252,0.35)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.05)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}>
            Ask Us About Sizing
          </Link>
        </div>
      </div>
    </div>
  );
}
