import { Suspense, useState } from 'react';
import PageBackground from '../components/three/PageBackground';

const TOPICS = ['Order / Tracking', 'Returns & Exchanges', 'Sizing Question', 'Product Question', 'Other'];

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [focused, setFocused] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  const inputStyle = (name: string): React.CSSProperties => ({
    width: '100%',
    background: focused === name ? 'rgba(255,95,160,0.12)' : 'rgba(255,255,255,0.05)',
    border: `1px solid ${focused === name ? 'rgba(255,100,180,0.6)' : 'rgba(255,255,255,0.1)'}`,
    borderRadius: 12,
    padding: '12px 16px',
    color: '#fff',
    fontSize: 14,
    outline: 'none',
    transition: 'all 0.25s',
    boxShadow: focused === name ? '0 0 20px rgba(255,80,160,0.2)' : 'none',
  });

  return (
    <div className="relative min-h-screen text-white">
      <Suspense fallback={null}>
        <PageBackground accent="#c084fc" />
      </Suspense>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-20">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.35em] text-pink-400 mb-3 font-semibold">Get in Touch</p>
          <h1 className="text-5xl sm:text-6xl font-serif font-bold mb-4"
            style={{ textShadow: '0 0 40px rgba(192,132,252,0.5)' }}>
            Contact Us
          </h1>
          <p className="text-pink-200/70">We typically respond within 1–2 business days.</p>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-3 gap-3 mb-10">
          {[
            { icon: '📧', label: 'Email', value: 'hello@pinkhalo.co' },
            { icon: '⏰', label: 'Response', value: '1–2 Business Days' },
            { icon: '💬', label: 'DMs Open', value: '@pinkhalo.co' },
          ].map(item => (
            <div key={item.label}
              className="text-center py-4 px-3 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <span className="text-xl block mb-1">{item.icon}</span>
              <p className="text-pink-400 text-[10px] uppercase tracking-wider">{item.label}</p>
              <p className="text-white text-xs font-semibold mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Form or success */}
        {submitted ? (
          <div className="text-center py-16 rounded-3xl"
            style={{ background: 'rgba(255,95,160,0.08)', border: '1px solid rgba(255,100,180,0.2)' }}>
            <div className="text-5xl mb-4">✨</div>
            <h2 className="text-2xl font-serif font-bold text-white mb-2">Message Sent!</h2>
            <p className="text-pink-200/70">We'll get back to you within 1–2 business days.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 24, padding: 32 }}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-pink-300 text-xs uppercase tracking-wider mb-1.5">Name</label>
                <input type="text" name="name" value={form.name} onChange={handleChange}
                  onFocus={() => setFocused('name')} onBlur={() => setFocused(null)}
                  placeholder="Your name" required style={inputStyle('name')} />
              </div>
              <div>
                <label className="block text-pink-300 text-xs uppercase tracking-wider mb-1.5">Email</label>
                <input type="email" name="email" value={form.email} onChange={handleChange}
                  onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
                  placeholder="your@email.com" required style={inputStyle('email')} />
              </div>
            </div>

            <div>
              <label className="block text-pink-300 text-xs uppercase tracking-wider mb-1.5">Subject</label>
              <select name="subject" value={form.subject} onChange={handleChange}
                onFocus={() => setFocused('subject')} onBlur={() => setFocused(null)}
                required style={{ ...inputStyle('subject'), appearance: 'none' as const }}>
                <option value="" style={{ background: '#1a0020' }}>Select a topic</option>
                {TOPICS.map(t => <option key={t} value={t} style={{ background: '#1a0020' }}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-pink-300 text-xs uppercase tracking-wider mb-1.5">Message</label>
              <textarea name="message" value={form.message} onChange={handleChange}
                onFocus={() => setFocused('message')} onBlur={() => setFocused(null)}
                placeholder="Tell us what's on your mind..." required rows={5}
                style={{ ...inputStyle('message'), resize: 'none' }} />
            </div>

            <button type="submit"
              className="w-full py-3.5 rounded-full font-bold text-white transition-all duration-300"
              style={{ background: 'linear-gradient(135deg, #ff5fa0, #c084fc)', boxShadow: '0 6px 25px rgba(255,50,130,0.4)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.02)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 10px 35px rgba(255,50,130,0.6)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 25px rgba(255,50,130,0.4)'; }}>
              Send Message ✨
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
