import categoryMen from "@/assets/category-men.jpg";

// Re-export Product interface from the hook for backwards compatibility
export type { Product } from "@/hooks/useProducts";

export interface Category {
  id: string;
  name: string;
  image: string;
  subcategories: string[];
}

export const categories: Category[] = [
  {
    id: "women",
    name: "Women's Fashion",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&h=400&fit=crop",
    subcategories: ["Dresses", "Tops", "Pants", "Skirts", "Jackets", "Accessories"],
  },
  {
    id: "men",
    name: "Men's Fashion",
    image: categoryMen,
    subcategories: ["Suits", "Shirts", "Pants", "Jackets", "Accessories"],
  },
  {
    id: "shoes",
    name: "Shoes",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop",
    subcategories: ["Heels", "Sneakers", "Boots", "Flats", "Sandals"],
  },
  {
    id: "bags",
    name: "Bags & Purses",
    image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=400&fit=crop",
    subcategories: ["Handbags", "Clutches", "Backpacks", "Totes", "Wallets"],
  },
  {
    id: "jewelry",
    name: "Jewelry",
    image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=400&fit=crop",
    subcategories: ["Necklaces", "Earrings", "Bracelets", "Rings", "Watches"],
  },
  {
    id: "kids",
    name: "Kids' Clothing",
    image: "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=400&h=400&fit=crop",
    subcategories: ["Boys", "Girls", "Babies", "Accessories"],
  },
];

// Price formatting utility
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(price);
};
