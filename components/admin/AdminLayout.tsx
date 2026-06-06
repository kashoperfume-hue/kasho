"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Tag,
  Settings,
  BarChart2,
  Image,
  Truck,
  CreditCard,
  LogOut,
  Menu,
  X,
  Home,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/coupons", label: "Coupons", icon: Tag },
  { href: "/admin/homepage", label: "Homepage", icon: Home },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/admin/settings/upi", label: "UPI Settings", icon: CreditCard },
  { href: "/admin/settings/shipping", label: "Shipping", icon: Truck },
];

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (pathname === "/admin/login") return <>{children}</>;

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  return (
    <div className="min-h-screen bg-cream flex">
      {/* Sidebar — desktop */}
      <div className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-60 bg-ink z-40">
        <div className="p-6 border-b border-cream/10">
          <Link href="/">
            <span className="font-display text-2xl tracking-[0.3em] text-cream uppercase">
              Kasho
            </span>
          </Link>
          <p className="text-[9px] tracking-widest uppercase text-gold/60 mt-1">
            Admin Panel
          </p>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-6 py-3 text-xs font-medium tracking-wider transition-all duration-200",
                pathname === item.href || pathname.startsWith(item.href + "/")
                  ? "text-gold bg-cream/5 border-l-2 border-gold"
                  : "text-cream/50 hover:text-cream hover:bg-cream/5 border-l-2 border-transparent"
              )}
            >
              <item.icon size={15} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-6 border-t border-cream/10">
          {profile && (
            <p className="text-xs text-cream/30 mb-4 truncate">{profile.email}</p>
          )}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-xs text-cream/40 hover:text-rose transition-colors"
          >
            <LogOut size={13} />
            Sign Out
          </button>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-ink border-b border-cream/10">
        <span className="font-display text-xl tracking-[0.3em] text-cream uppercase">Kasho</span>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-cream">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, x: -280 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -280 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            <div
              className="absolute inset-0 bg-ink/60"
              onClick={() => setMobileOpen(false)}
            />
            <div className="absolute left-0 top-0 bottom-0 w-60 bg-ink flex flex-col">
              <div className="p-6 pt-16">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 py-3 text-xs font-medium tracking-wider transition-all",
                      pathname === item.href
                        ? "text-gold"
                        : "text-cream/50 hover:text-cream"
                    )}
                  >
                    <item.icon size={15} />
                    {item.label}
                  </Link>
                ))}
              </div>
              <div className="p-6 mt-auto border-t border-cream/10">
                <button onClick={handleSignOut} className="flex items-center gap-2 text-xs text-cream/40">
                  <LogOut size={13} />
                  Sign Out
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 lg:ml-60 min-h-screen">
        <div className="pt-14 lg:pt-0">{children}</div>
      </div>
    </div>
  );
}
