import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-md border-b border-white/20 shadow-sm">
      <div className="flex justify-between items-center h-20 px-4 md:px-6 max-w-container-max mx-auto">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-[18px]">child_care</span>
          </div>
          <span className="text-xl font-bold text-primary">TumbuhSehat</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="/#fitur" className="text-on-surface-variant hover:text-primary transition-colors text-sm font-semibold">Fitur</Link>
          <Link href="/#cara-kerja" className="text-on-surface-variant hover:text-primary transition-colors text-sm font-semibold">Cara Kerja</Link>
          <Link href="/#tentang" className="text-on-surface-variant hover:text-primary transition-colors text-sm font-semibold">Tentang</Link>
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/daftar"
            className="bg-primary text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-primary-container transition-colors shadow-sm hover:shadow-md hover:-translate-y-0.5 transform duration-200"
          >
            Daftar sebagai Tenaga Kesehatan
          </Link>
        </div>

        {/* Mobile Menu */}
        <button className="md:hidden text-primary">
          <span className="material-symbols-outlined">menu</span>
        </button>
      </div>
    </nav>
  );
}
