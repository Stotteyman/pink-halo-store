export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-pink-100 bg-white/50 py-8">
      <div className="max-w-7xl mx-auto px-4 text-center text-sm text-pink-700">
        <p>© {year} Pink Halo Co. Handpicked essentials.</p>
      </div>
    </footer>
  );
}
