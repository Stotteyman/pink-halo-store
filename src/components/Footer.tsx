export default function Footer() {
  return (
    <footer className="mt-12 border-t border-neutral-800 pt-8 text-center text-gray-400">
      <div className="container mx-auto px-4">
        <p>© {new Date().getFullYear()} Pink Halo Co. — All rights reserved.</p>
        <p className="text-sm mt-2">Designed with love — powered by Tailwind + DaisyUI</p>
      </div>
    </footer>
  );
}
