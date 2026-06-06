import { createClient } from "@/lib/supabase/server";
import type { Product, ProductFilters, PaginatedResponse } from "@/types";

export async function getProducts(
  filters: ProductFilters = {}
): Promise<PaginatedResponse<Product>> {
  const supabase = await createClient();
  const {
    category,
    collection,
    min_price,
    max_price,
    in_stock,
    is_featured,
    is_new_arrival,
    is_best_seller,
    is_trending,
    search,
    sort = "newest",
    page = 1,
    per_page = 12,
  } = filters;

  let query = supabase
    .from("products")
    .select("*, category:categories(*)", { count: "exact" })
    .eq("is_active", true);

  if (category) {
    query = query.eq("categories.slug", category);
  }
  if (collection) {
    query = query.eq("collection_type", collection);
  }
  if (min_price !== undefined) {
    query = query.gte("sale_price", min_price);
  }
  if (max_price !== undefined) {
    query = query.lte("sale_price", max_price);
  }
  if (in_stock) {
    query = query.gt("stock_quantity", 0);
  }
  if (is_featured) {
    query = query.eq("is_featured", true);
  }
  if (is_new_arrival) {
    query = query.eq("is_new_arrival", true);
  }
  if (is_best_seller) {
    query = query.eq("is_best_seller", true);
  }
  if (is_trending) {
    query = query.eq("is_trending", true);
  }
  if (search) {
    query = query.or(
      `name.ilike.%${search}%,description.ilike.%${search}%,tags.cs.{${search}}`
    );
  }

  switch (sort) {
    case "price_asc":
      query = query.order("sale_price", { ascending: true });
      break;
    case "price_desc":
      query = query.order("sale_price", { ascending: false });
      break;
    case "popular":
      query = query.order("review_count", { ascending: false });
      break;
    case "rating":
      query = query.order("average_rating", { ascending: false });
      break;
    case "trending":
      query = query.eq("is_trending", true).order("created_at", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const from = (page - 1) * per_page;
  query = query.range(from, from + per_page - 1);

  const { data, count, error } = await query;

  if (error) {
    console.error("Error fetching products:", error);
    return { data: [], total: 0, page, per_page, has_more: false };
  }

  return {
    data: (data as Product[]) || [],
    total: count || 0,
    page,
    per_page,
    has_more: (count || 0) > page * per_page,
  };
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, category:categories(*)")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error) return null;
  return data as Product;
}

export async function getRelatedProducts(
  productId: string,
  categoryId: string | null,
  limit = 4
): Promise<Product[]> {
  const supabase = await createClient();
  let query = supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .neq("id", productId)
    .limit(limit);

  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  const { data } = await query;
  return (data as Product[]) || [];
}

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as Product[]) || [];
}

export async function getNewArrivals(limit = 8): Promise<Product[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .eq("is_new_arrival", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as Product[]) || [];
}

export async function getBestSellers(limit = 8): Promise<Product[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .eq("is_best_seller", true)
    .order("review_count", { ascending: false })
    .limit(limit);
  return (data as Product[]) || [];
}

export async function getTrendingProducts(limit = 8): Promise<Product[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .eq("is_trending", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as Product[]) || [];
}

export async function searchProducts(query: string, limit = 10): Promise<Product[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("id, name, slug, thumbnail, sale_price, original_price")
    .eq("is_active", true)
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    .limit(limit);
  return (data as Product[]) || [];
}
