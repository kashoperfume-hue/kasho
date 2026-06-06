"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Package, ChevronRight } from "lucide-react";
import { formatPrice, formatDate, getImageUrl } from "@/lib/utils";
import type { Order } from "@/types";

interface OrderCardProps {
  order: Order;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: "bg-gold/10", text: "text-gold", label: "Pending" },
  payment_pending: { bg: "bg-gold/10", text: "text-gold", label: "Payment Pending" },
  payment_confirmed: { bg: "bg-sage/20", text: "text-sage-700", label: "Payment Confirmed" },
  processing: { bg: "bg-sage/20", text: "text-sage-700", label: "Processing" },
  packed: { bg: "bg-sage/30", text: "text-sage-700", label: "Packed" },
  shipped: { bg: "bg-beige", text: "text-charcoal", label: "Shipped" },
  out_for_delivery: { bg: "bg-sage/40", text: "text-sage-700", label: "Out for Delivery" },
  delivered: { bg: "bg-beige", text: "text-charcoal", label: "Delivered" },
  cancelled: { bg: "bg-rose/20", text: "text-rose", label: "Cancelled" },
  refunded: { bg: "bg-rose/10", text: "text-rose", label: "Refunded" },
};

export default function OrderCard({ order }: OrderCardProps) {
  const status = STATUS_STYLES[order.status] || { bg: "bg-beige", text: "text-charcoal", label: order.status };
  const firstImage = order.items?.[0]?.product_image;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.3 }}
    >
      <Link href={`/account/orders/${order.id}`} className="block border border-beige bg-cream hover:border-charcoal/30 transition-all duration-300 group">
        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="font-mono text-xs text-charcoal/50 font-medium">{order.order_number}</p>
              <p className="text-xs text-charcoal/30 mt-0.5">{formatDate(order.created_at)}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 text-[9px] font-medium tracking-widest uppercase ${status.bg} ${status.text}`}>
                {status.label}
              </span>
              <ChevronRight size={14} className="text-charcoal/30 group-hover:text-charcoal transition-colors" />
            </div>
          </div>

          {/* Items preview */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex -space-x-2">
              {order.items?.slice(0, 3).map((item, i) => (
                <div key={item.id} className="relative w-10 h-12 bg-beige/40 border border-cream overflow-hidden flex-shrink-0" style={{ zIndex: 3 - i }}>
                  <Image
                    src={getImageUrl(item.product_image)}
                    alt={item.product_name}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                </div>
              ))}
              {(order.items?.length || 0) > 3 && (
                <div className="relative w-10 h-12 bg-beige/60 border border-cream flex items-center justify-center text-xs text-charcoal/50">
                  +{order.items.length - 3}
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="text-xs text-charcoal font-medium leading-tight">
                {order.items?.[0]?.product_name}
                {(order.items?.length || 0) > 1 && <span className="text-charcoal/40"> +{order.items.length - 1} more</span>}
              </p>
              <p className="text-xs text-charcoal/40 mt-0.5">
                {order.items?.reduce((s, i) => s + i.quantity, 0)} item{(order.items?.reduce((s, i) => s + i.quantity, 0) || 0) !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-beige/60">
            <div className="flex items-center gap-2">
              <Package size={12} className="text-charcoal/30" />
              <span className="text-xs text-charcoal/50 uppercase tracking-wider">
                {order.payment_method === "cod" ? "Cash on Delivery" : "UPI"}
              </span>
            </div>
            <span className="font-serif text-base text-charcoal font-medium">{formatPrice(order.total)}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
