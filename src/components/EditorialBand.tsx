import { useNavigate } from 'react-router-dom';

/** Dark rosewood editorial band — "The Halo Edit" stylist picks. */
export default function EditorialBand() {
  const navigate = useNavigate();

  return (
    <section className="bg-rosewood text-[#F5E8E2] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 lg:py-24 grid lg:grid-cols-2 gap-10 lg:gap-20 items-center">
        <div>
          <p className="overline text-gold">The Halo Edit</p>
          <h2 className="font-serif font-medium leading-[1.05] text-4xl md:text-[54px] mt-4 mb-5">
            Soft-glam pieces,
            <br />
            <em className="italic text-[#DFAEB8]">editorial energy.</em>
          </h2>
          <p className="text-[15px] text-[#CFB2B4] max-w-md mb-8">
            Our stylists' monthly edit — the sets, dresses and accessories we're wearing on repeat right now.
          </p>
          <button onClick={() => navigate('/new')} className="btn-light">
            Discover the edit
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          <figure className="m-0 overflow-hidden bg-[#5C3B43]" style={{ aspectRatio: '3/4' }}>
            <img
              src="/products/pink-performance-curve-set.png"
              alt="Pink Performance Curve Set"
              loading="lazy"
              className="w-full h-full object-cover"
            />
          </figure>
          <figure className="m-0 overflow-hidden bg-[#5C3B43] translate-y-7" style={{ aspectRatio: '3/4' }}>
            <img
              src="/products/soft-halo-tee-short-set.png"
              alt="Soft Halo Tee and Short Set"
              loading="lazy"
              className="w-full h-full object-cover"
            />
          </figure>
        </div>
      </div>
    </section>
  );
}
