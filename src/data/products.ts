import categoryMen from "@/assets/category-men.jpg";
import categoryWomen from "@/assets/category-women.jpg";
import categoryShoes from "@/assets/category-shoes.jpg";
import categoryBags from "@/assets/category-bags.jpg";
import categoryJewelry from "@/assets/category-jewelry.jpg";
import categoryKids from "@/assets/category-kids.jpg";

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
    image: categoryWomen,
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
    image: categoryShoes,
    subcategories: ["Heels", "Sneakers", "Boots", "Flats", "Sandals"],
  },
  {
    id: "bags",
    name: "Bags & Purses",
    image: categoryBags,
    subcategories: ["Handbags", "Clutches", "Backpacks", "Totes", "Wallets"],
  },
  {
    id: "jewelry",
    name: "Jewelry",
    image: categoryJewelry,
    subcategories: ["Necklaces", "Earrings", "Bracelets", "Rings", "Watches"],
  },
  {
    id: "kids",
    name: "Kids' Clothing",
    image: categoryKids,
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
