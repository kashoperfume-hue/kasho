"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag,
  Heart,
  Search,
  Menu,
  X,
  User,
  ChevronDown,
} from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const navigation = [
  { label: "Collections", href: "/collections", hasDropdown: true },
  { label: "Men", href: "/collections/mens" },
  { label: "Women", href: "/collections/womens" },
  { label: "Unisex", href: "/collections/unisex" },
  {
    label: "Limited Edition",
    href: "/collections/limited-edition",
    special: true,
  },
];

const collections = [
  { label: "Men's Collection", href: "/collections/mens", desc: "Bold & sophisticated" },
  { label: "Women's Collection", href: "/collections/womens", desc: "Elegant & alluring" },
  { label: "Unisex", href: "/collections/unisex", desc: "Boundary-defying" },
  { label: "Limited Edition", href: "/collections/limited-edition", desc: "Rare & exclusive" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [collectionsOpen, setCollectionsOpen] = useState(false);
  const { totalItems, openCart } = useCart();
  const { count: wishlistCount } = useWishlist();
  const { user, profile } = useAuth();

  // Secret admin trigger: click logo 5 times
  const logoClickCount = useRef(0);
  const logoClickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Secret admin trigger: long press
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLogoClick = useCallback(() => {
    logoClickCount.current += 1;
    if (logoClickTimer.current) clearTimeout(logoClickTimer.current);
    if (logoClickCount.current >= 5) {
      logoClickCount.current = 0;
      router.push("/admin/login");
      return;
    }
    logoClickTimer.current = setTimeout(() => {
      logoClickCount.current = 0;
    }, 2000);
  }, [router]);

  const handleLogoMouseDown = useCallback(() => {
    longPressTimer.current = setTimeout(() => {
      router.push("/admin/login");
    }, 3000);
  }, [router]);

  const handleLogoMouseUp = useCallback(() => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
    setCollectionsOpen(false);
  }, [pathname]);

  const isHomePage = pathname === "/";

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          scrolled || !isHomePage || mobileOpen
            ? "glass border-b border-beige/60 shadow-luxury"
            : "bg-transparent"
        )}
      >
        <div className="page-container">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link
              href="/"
              onClick={handleLogoClick}
              onMouseDown={handleLogoMouseDown}
              onMouseUp={handleLogoMouseUp}
              onTouchStart={handleLogoMouseDown}
              onTouchEnd={handleLogoMouseUp}
              className="select-none"
            >
              <span className="font-display text-2xl lg:text-3xl font-light tracking-[0.3em] text-charcoal hover:text-gold transition-colors duration-300 uppercase">
                Kasho
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8">
              {navigation.map((item) =>
                item.hasDropdown ? (
                  <div
                    key={item.label}
                    className="relative"
                    onMouseEnter={() => setCollectionsOpen(true)}
                    onMouseLeave={() => setCollectionsOpen(false)}
                  >
                    <button className="nav-link flex items-center gap-1">
                      {item.label}
                      <ChevronDown
                        size={12}
                        className={cn(
                          "transition-transform duration-200",
                          collectionsOpen && "rotate-180"
                        )}
                      />
                    </button>
                    <AnimatePresence>
                      {collectionsOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          transition={{ duration: 0.2 }}
                          className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-56 glass border border-beige/60 shadow-luxury-lg"
                        >
                          {collections.map((col) => (
                            <Link
                              key={col.href}
                              href={col.href}
                              className="block px-5 py-3 hover:bg-beige/40 transition-colors group"
                            >
                              <p className="text-xs font-medium tracking-wider uppercase text-charcoal group-hover:text-gold transition-colors">
                                {col.label}
                              </p>
                              <p className="text-xs text-charcoal/50 mt-0.5">
                                {col.desc}
                              </p>
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={cn(
                      "nav-link",
                      item.special && "text-gold",
                      pathname === item.href && "text-gold"
                    )}
                  >
                    {item.label}
                  </Link>
                )
              )}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 text-charcoal hover:text-gold transition-colors"
                aria-label="Search"
              >
                <Search size={18} />
              </button>

              <Link
                href="/account/wishlist"
                className="relative p-2 text-charcoal hover:text-gold transition-colors hidden sm:flex"
                aria-label="Wishlist"
              >
                <Heart size={18} />
                {wishlistCount() > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose text-charcoal text-[9px] font-medium flex items-center justify-center rounded-full">
                    {wishlistCount()}
                  </span>
                )}
              </Link>

              <button
                onClick={openCart}
                className="relative p-2 text-charcoal hover:text-gold transition-colors"
                aria-label="Cart"
              >
                <ShoppingBag size={18} />
                {totalItems() > 0 && (
                  <motion.span
                    key={totalItems()}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-charcoal text-cream text-[9px] font-medium flex items-center justify-center rounded-full"
                  >
                    {totalItems()}
                  </motion.span>
                )}
              </button>

              {user ? (
                <Link
                  href="/account"
                  className="hidden sm:flex p-2 text-charcoal hover:text-gold transition-colors"
                  aria-label="Account"
                >
                  <User size={18} />
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="hidden sm:flex nav-link"
                >
                  Login
                </Link>
              )}

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden p-2 text-charcoal"
                aria-label="Menu"
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden glass border-t border-beige/60 overflow-hidden"
            >
              <div className="page-container py-6 space-y-1">
                {[
                  { label: "Men's", href: "/collections/mens" },
                  { label: "Women's", href: "/collections/womens" },
                  { label: "Unisex", href: "/collections/unisex" },
                  { label: "Limited Edition", href: "/collections/limited-edition" },
                  { label: "All Products", href: "/products" },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block py-3 text-sm font-medium tracking-widest uppercase text-charcoal hover:text-gold transition-colors border-b border-beige/40 last:border-0"
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="pt-4 flex gap-4">
                  {user ? (
                    <Link href="/account" className="nav-link">
                      My Account
                    </Link>
                  ) : (
                    <>
                      <Link href="/login" className="nav-link">
                        Login
                      </Link>
                      <Link href="/register" className="nav-link">
                        Register
                      </Link>
                    </>
                  )}
                  <Link href="/account/wishlist" className="nav-link flex items-center gap-1">
                    <Heart size={14} />
                    Wishlist {wishlistCount() > 0 && `(${wishlistCount()})`}
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Search Overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-cream/95 backdrop-blur-md flex items-start justify-center pt-32"
          >
            <button
              onClick={() => setSearchOpen(false)}
              className="absolute top-6 right-6 p-2 text-charcoal hover:text-gold transition-colors"
            >
              <X size={24} />
            </button>
            <div className="w-full max-w-2xl px-8">
              <p className="section-label text-center mb-6">Search Kasho</p>
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-0 top-1/2 -translate-y-1/2 text-beige-300"
                />
                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && searchQuery.trim()) {
                      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                      setSearchOpen(false);
                    }
                  }}
                  placeholder="Search fragrances, notes, collections..."
                  className="w-full bg-transparent border-b-2 border-beige pl-7 pr-4 py-3 text-charcoal placeholder-beige-300 focus:outline-none focus:border-charcoal transition-colors duration-300 text-lg font-light"
                />
              </div>
              <p className="text-center text-xs text-charcoal/40 mt-4 tracking-wider">
                Press Enter to search
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
