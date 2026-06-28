export default function AboutPage() {
  return (
    <div className="flex-1 py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <p className="text-xs uppercase tracking-widest text-pink-400 mb-2">Our Story</p>
        <h1 className="text-4xl sm:text-5xl font-serif font-bold text-pink-900 mb-6">About Pink Halo</h1>

        <div className="prose prose-pink max-w-none text-pink-800 space-y-6 text-[15px] leading-relaxed">
          <p>
            Pink Halo is a women's clothing and lifestyle boutique built for the woman who knows how to shine.
            We curate feminine, dreamy, and elegant styles that take you from brunch to date night — and everywhere in between.
          </p>
          <p>
            Every piece in our collection is handpicked with intention. We believe getting dressed should feel like a ritual,
            not a chore. That's why we focus on quality fabrics, flattering silhouettes, and styles that make you feel like
            the best version of yourself.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 my-10 not-prose">
            {[
              { stat: 'Handpicked', label: 'Every item personally curated' },
              { stat: 'New Weekly', label: 'Fresh arrivals every week' },
              { stat: 'Boutique Quality', label: 'Premium, feminine styling' },
            ].map(item => (
              <div key={item.stat} className="text-center p-6 rounded-2xl bg-pink-50 border border-pink-100">
                <p className="text-2xl font-serif font-bold text-pink-900">{item.stat}</p>
                <p className="text-sm text-pink-600 mt-1">{item.label}</p>
              </div>
            ))}
          </div>

          <h2 className="text-2xl font-serif font-bold text-pink-900 !mt-10">Our Promise</h2>
          <p>
            We promise to always bring you styles that feel elevated without being unapproachable. Whether you're building
            a capsule wardrobe or looking for something special for an occasion, Pink Halo has something for every version of you.
          </p>
          <p>
            Our official brand phrase — <strong>Wear Your Halo</strong> — is a reminder that you deserve to feel radiant every single day.
          </p>

          <h2 className="text-2xl font-serif font-bold text-pink-900 !mt-10">The Halo Points Rewards Program</h2>
          <p>
            Every purchase earns you Halo Points. Redeem points for discounts, early access to new arrivals, and exclusive
            members-only perks. It's our way of saying thank you for being part of our community.
          </p>
        </div>
      </div>
    </div>
  );
}
