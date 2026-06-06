import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function generateOrderNumber(): string {
  const prefix = "KSH";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}${timestamp}${random}`;
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.substring(0, length) + "…";
}

export function getDiscountPercentage(original: number, sale: number): number {
  if (original <= 0) return 0;
  return Math.round(((original - sale) / original) * 100);
}

export function getImageUrl(path: string | null | undefined): string {
  if (!path) return "/images/placeholder-product.svg";
  if (path.startsWith("http")) return path;
  if (path.startsWith("/")) return path;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${supabaseUrl}/storage/v1/object/public/${path}`;
}

export function generateSKU(name: string, category: string): string {
  const namePart = name.substring(0, 3).toUpperCase();
  const catPart = category.substring(0, 2).toUpperCase();
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${catPart}${namePart}${num}`;
}

export function validatePincode(pincode: string): boolean {
  return /^[1-9][0-9]{5}$/.test(pincode);
}

export function calculateCartTotals(
  items: { quantity: number; product: { sale_price: number } }[]
) {
  const subtotal = items.reduce(
    (sum, item) => sum + item.product.sale_price * item.quantity,
    0
  );
  const shipping = subtotal >= 999 ? 0 : 99;
  return { subtotal, shipping };
}
