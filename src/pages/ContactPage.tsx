import { useState } from 'react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className="flex-1 py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <p className="text-xs uppercase tracking-widest text-pink-400 mb-2">Get in Touch</p>
        <h1 className="text-4xl sm:text-5xl font-serif font-bold text-pink-900 mb-4">Contact Us</h1>
        <p className="text-pink-600 mb-10">
          Have a question about your order, a product, or just want to say hi? We'd love to hear from you.
          We typically respond within 1–2 business days.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            { icon: '📧', label: 'Email', value: 'hello@pinkhalo.co' },
            { icon: '⏰', label: 'Response Time', value: '1–2 Business Days' },
            { icon: '💬', label: 'DMs Open', value: '@pinkhalo.co' },
          ].map(item => (
            <div key={item.label} className="text-center p-4 rounded-2xl bg-pink-50 border border-pink-100">
              <p className="text-2xl mb-1">{item.icon}</p>
              <p className="text-xs text-pink-400 uppercase tracking-wider">{item.label}</p>
              <p className="text-sm font-semibold text-pink-900 mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>

        {submitted ? (
          <div className="rounded-2xl bg-pink-50 border border-pink-200 p-8 text-center">
            <p className="text-3xl mb-3">✨</p>
            <h2 className="text-xl font-serif font-bold text-pink-900 mb-2">Message Sent!</h2>
            <p className="text-pink-600">Thank you for reaching out. We'll get back to you within 1–2 business days.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-pink-900 mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="Your name"
                  className="w-full px-4 py-3 border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-pink-900 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-pink-900 mb-1">Subject</label>
              <select
                name="subject"
                value={form.subject}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 text-sm bg-white"
              >
                <option value="">Select a topic</option>
                <option value="order">Order / Tracking</option>
                <option value="returns">Returns & Exchanges</option>
                <option value="sizing">Sizing Question</option>
                <option value="product">Product Question</option>
                <option value="wholesale">Wholesale</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-pink-900 mb-1">Message</label>
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                required
                rows={5}
                placeholder="Tell us what's on your mind..."
                className="w-full px-4 py-3 border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 text-sm resize-none"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3.5 bg-pink-900 hover:bg-pink-800 text-white rounded-full font-semibold transition text-sm"
            >
              Send Message
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
