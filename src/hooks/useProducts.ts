import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  images: string[];
  category: string;
  subcategory: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  sizes?: string[];
  colors?: { name: string; hex: string }[];
  featured?: boolean;
  isNew?: boolean;
  isBestSeller?: boolean;
}

interface UseProductsResult {
  products: Product[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UseProductResult {
  product: Product | null;
  loading: boolean;
  error: string | null;
}

// Transform database product to frontend Product interface
const transformProduct = (dbProduct: any): Product => ({
  id: dbProduct.id,
  name: dbProduct.name,
  description: dbProduct.description || "",
  price: Number(dbProduct.price),
  originalPrice: dbProduct.original_price ? Number(dbProduct.original_price) : undefined,
  discount: dbProduct.discount || undefined,
  images: dbProduct.images || [],
  category: dbProduct.category,
  subcategory: dbProduct.subcategory || "",
  rating: 4.5, // Default rating since not in DB
  reviewCount: Math.floor(Math.random() * 100) + 10, // Placeholder
  inStock: dbProduct.in_stock ?? true,
  sizes: dbProduct.sizes || [],
  colors: Array.isArray(dbProduct.colors) ? dbProduct.colors : [],
  featured: dbProduct.featured || false,
  isNew: dbProduct.is_new || false,
  isBestSeller: dbProduct.is_best_seller || false,
});

export const useProducts = (categoryFilter?: string): UseProductsResult => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let query = supabase.from("products").select("*");
      
      if (categoryFilter) {
        query = query.eq("category", categoryFilter);
      }
      
      const { data, error: fetchError } = await query.order("created_at", { ascending: false });
      
      if (fetchError) throw fetchError;
      
      setProducts((data || []).map(transformProduct));
    } catch (err: any) {
      setError(err.message);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [categoryFilter]);

  return { products, loading, error, refetch: fetchProducts };
};

export const useProduct = (id: string): UseProductResult => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        const { data, error: fetchError } = await supabase
          .from("products")
          .select("*")
          .eq("id", id)
          .maybeSingle();
        
        if (fetchError) throw fetchError;
        
        setProduct(data ? transformProduct(data) : null);
      } catch (err: any) {
        setError(err.message);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  return { product, loading, error };
};

export const useFeaturedProducts = (): UseProductsResult => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from("products")
        .select("*")
        .eq("featured", true)
        .order("created_at", { ascending: false })
        .limit(8);
      
      if (fetchError) throw fetchError;
      
      setProducts((data || []).map(transformProduct));
    } catch (err: any) {
      setError(err.message);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return { products, loading, error, refetch: fetchProducts };
};

export const useSearchProducts = (query: string): UseProductsResult => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    if (!query.trim()) {
      setProducts([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from("products")
        .select("*")
        .or(`name.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%,subcategory.ilike.%${query}%`)
        .limit(8);
      
      if (fetchError) throw fetchError;
      
      setProducts((data || []).map(transformProduct));
    } catch (err: any) {
      setError(err.message);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(fetchProducts, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  return { products, loading, error, refetch: fetchProducts };
};
