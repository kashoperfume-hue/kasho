"use client";

import { motion } from "framer-motion";
import { CheckCircle, Circle, Package, Truck, MapPin, Home } from "lucide-react";
import type { TrackingUpdate, OrderStatus } from "@/types";

interface TrackingTimelineProps {
  updates: TrackingUpdate[];
  currentStatus: OrderStatus;
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Circle size={16} />,
  payment_pending: <Circle size={16} />,
  payment_confirmed: <CheckCircle size={16} />,
  processing: <Package size={16} />,
  packed: <Package size={16} />,
  shipped: <Truck size={16} />,
  out_for_delivery: <MapPin size={16} />,
  delivered: <Home size={16} />,
  cancelled: <Circle size={16} />,
};

export default function TrackingTimeline({ updates, currentStatus }: TrackingTimelineProps) {
  if (!updates?.length) {
    return (
      <div className="flex items-center gap-3 py-4 text-charcoal/30">
        <Circle size={14} />
        <p className="text-sm">No tracking updates yet</p>
      </div>
    );
  }

  const sorted = [...updates].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="space-y-0">
      {sorted.map((update, i) => {
        const isLatest = i === 0;
        const icon = STATUS_ICONS[update.status] || <Circle size={16} />;

        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="flex gap-4"
          >
            {/* Timeline line + dot */}
            <div className="flex flex-col items-center">
              <div className={`flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full transition-all ${
                isLatest
                  ? "bg-charcoal text-cream"
                  : "bg-beige/60 text-charcoal/40"
              }`}>
                {icon}
              </div>
              {i < sorted.length - 1 && (
                <div className="w-px flex-1 bg-beige/60 my-1 min-h-[20px]" />
              )}
            </div>

            {/* Content */}
            <div className={`pb-5 ${i === sorted.length - 1 ? "pb-0" : ""}`}>
              <p className={`text-sm font-medium capitalize ${isLatest ? "text-charcoal" : "text-charcoal/60"}`}>
                {update.status.replace(/_/g, " ")}
              </p>
              <p className={`text-xs mt-0.5 leading-relaxed ${isLatest ? "text-charcoal/70" : "text-charcoal/40"}`}>
                {update.message}
              </p>
              {update.location && (
                <p className="text-xs text-charcoal/30 mt-0.5 flex items-center gap-1">
                  <MapPin size={10} />
                  {update.location}
                </p>
              )}
              <p className="text-[10px] text-charcoal/30 mt-1">
                {new Intl.DateTimeFormat("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }).format(new Date(update.timestamp))}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
