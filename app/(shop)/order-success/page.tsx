"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, Package, ArrowRight } from "lucide-react";

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("order");

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="text-center max-w-md"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
          className="w-20 h-20 bg-sage/30 flex items-center justify-center mx-auto mb-8"
        >
          <CheckCircle size={36} className="text-sage-700" />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <p className="section-label mb-4">Order Confirmed</p>
          <h1 className="font-serif text-4xl text-charcoal font-light mb-4">
            Thank You!
          </h1>
          <p className="text-charcoal/60 text-sm leading-relaxed mb-3">
            Your Kasho order has been placed successfully. We&apos;ll prepare your fragrance with care and ship it to you soon.
          </p>
          {orderNumber && (
            <p className="text-xs font-mono font-medium text-gold bg-gold/10 px-4 py-2 inline-block mb-8">
              Order #{orderNumber}
            </p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <Link href="/account/orders" className="btn-outline text-xs flex items-center gap-2 justify-center">
            <Package size={13} />
            Track Order
          </Link>
          <Link href="/products" className="btn-primary text-xs flex items-center gap-2 justify-center">
            Continue Shopping
            <ArrowRight size={13} />
          </Link>
        </motion.div>

        <motion.p
          className="text-xs text-charcoal/30 mt-8 max-w-xs mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          A confirmation email has been sent to your registered email address.
        </motion.p>
      </motion.div>
    </div>
  );
}
