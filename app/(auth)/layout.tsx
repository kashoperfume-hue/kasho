import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <div className="flex items-center justify-center py-8">
        <Link href="/">
          <span className="font-display text-3xl font-light tracking-[0.4em] text-charcoal uppercase hover:text-gold transition-colors">
            Kasho
          </span>
        </Link>
      </div>
      <main className="flex-1 flex items-center justify-center px-4 pb-12">
        {children}
      </main>
      <div className="text-center py-6 text-xs text-charcoal/30">
        © {new Date().getFullYear()} Kasho. All rights reserved.
      </div>
    </div>
  );
}
