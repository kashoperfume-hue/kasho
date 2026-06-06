"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, ShoppingBag, Heart, MapPin, Star, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const links = [
  { href: "/account", label: "Profile", icon: User, exact: true },
  { href: "/account/orders", label: "My Orders", icon: ShoppingBag },
  { href: "/account/wishlist", label: "Wishlist", icon: Heart },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/reviews", label: "My Reviews", icon: Star },
];

export default function AccountSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <div className="lg:col-span-1">
      <nav className="space-y-1">
        {links.map((link) => {
          const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 text-xs font-medium tracking-wider uppercase transition-all duration-200 border-l-2",
                active
                  ? "text-charcoal border-gold bg-beige/40"
                  : "text-charcoal/50 border-transparent hover:text-charcoal hover:bg-beige/20"
              )}
            >
              <link.icon size={14} />
              {link.label}
            </Link>
          );
        })}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-3 text-xs font-medium tracking-wider uppercase text-charcoal/30 hover:text-rose transition-colors border-l-2 border-transparent"
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </nav>
    </div>
  );
}
