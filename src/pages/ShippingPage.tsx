export default function ShippingPage() {
  return (
    <div className="flex-1 py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <p className="text-xs uppercase tracking-widest text-pink-400 mb-2">Shipping & Delivery</p>
        <h1 className="text-4xl sm:text-5xl font-serif font-bold text-pink-900 mb-4">Shipping Info</h1>
        <p className="text-pink-600 mb-10">
          We want your Pink Halo order to arrive quickly and safely. Here's everything you need to know.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            { icon: '🚚', title: 'Free Shipping', desc: 'On all orders over $75' },
            { icon: '📦', title: '5–7 Days', desc: 'Standard shipping' },
            { icon: '⚡', title: '2–3 Days', desc: 'Expedited shipping available' },
          ].map(item => (
            <div key={item.title} className="text-center p-5 rounded-2xl bg-pink-50 border border-pink-100">
              <p className="text-2xl mb-1">{item.icon}</p>
              <p className="font-semibold text-pink-900">{item.title}</p>
              <p className="text-sm text-pink-500 mt-0.5">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="space-y-6 text-[15px] text-pink-800">
          <section>
            <h2 className="text-xl font-serif font-bold text-pink-900 mb-3">Shipping Options</h2>
            <div className="bg-white rounded-2xl border border-pink-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-pink-50">
                  <tr>
                    <th className="text-left px-4 py-3 text-pink-700 font-semibold">Method</th>
                    <th className="text-left px-4 py-3 text-pink-700 font-semibold">Timeframe</th>
                    <th className="text-left px-4 py-3 text-pink-700 font-semibold">Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pink-50">
                  <tr>
                    <td className="px-4 py-3 text-pink-800">Standard</td>
                    <td className="px-4 py-3 text-pink-600">5–7 business days</td>
                    <td className="px-4 py-3 text-pink-600">$5.99 (Free over $75)</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-pink-800">Expedited</td>
                    <td className="px-4 py-3 text-pink-600">2–3 business days</td>
                    <td className="px-4 py-3 text-pink-600">$12.99</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-pink-800">Overnight</td>
                    <td className="px-4 py-3 text-pink-600">Next business day</td>
                    <td className="px-4 py-3 text-pink-600">$24.99</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-serif font-bold text-pink-900 mb-3">Processing Time</h2>
            <p className="leading-relaxed text-pink-700">
              Orders are processed within 1–2 business days. Orders placed after 2 PM EST or on weekends/holidays
              will begin processing the next business day. You'll receive a shipping confirmation with tracking
              information as soon as your order ships.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-serif font-bold text-pink-900 mb-3">Order Tracking</h2>
            <p className="leading-relaxed text-pink-700">
              Once your order ships, you'll receive an email with a tracking number. You can use this number to
              track your package directly on the carrier's website. If you haven't received a tracking email
              within 3 business days, please contact us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-serif font-bold text-pink-900 mb-3">Shipping to P.O. Boxes</h2>
            <p className="leading-relaxed text-pink-700">
              We ship to P.O. Boxes via standard shipping only. Expedited and overnight shipping require a
              physical address.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-serif font-bold text-pink-900 mb-3">International Shipping</h2>
            <p className="leading-relaxed text-pink-700">
              We currently ship within the United States only. International shipping is coming soon —
              sign up for our newsletter to be the first to know.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
