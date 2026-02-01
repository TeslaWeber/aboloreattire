import { useState, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { categories, formatPrice } from "@/data/products";
import { useProducts } from "@/hooks/useProducts";
import { Skeleton } from "@/components/ui/skeleton";

const Products = () => {
  const [searchParams] = useSearchParams();
  const categoryFilter = searchParams.get("category") || undefined;
  const [sortBy, setSortBy] = useState("featured");
  
  const { products, loading, error } = useProducts(categoryFilter);

  const sortedProducts = useMemo(() => {
    let sorted = [...products];
    switch (sortBy) {
      case "price-low": sorted.sort((a, b) => a.price - b.price); break;
      case "price-high": sorted.sort((a, b) => b.price - a.price); break;
      case "rating": sorted.sort((a, b) => b.rating - a.rating); break;
      default: sorted.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }
    return sorted;
  }, [products, sortBy]);

  const activeCategory = categories.find((c) => c.id === categoryFilter);

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <div className="text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary">Home</Link> / <span className="text-foreground">{activeCategory?.name || "All Products"}</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-64 shrink-0">
            <h3 className="font-display text-lg font-semibold mb-4">Categories</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/products" className={`block py-2 px-3 rounded-lg transition-colors ${!categoryFilter ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                  All Products
                </Link>
              </li>
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link to={`/products?category=${cat.id}`} className={`block py-2 px-3 rounded-lg transition-colors ${categoryFilter === cat.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-6">
              <p className="text-muted-foreground">
                {loading ? "Loading..." : `${sortedProducts.length} products`}
              </p>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Top Rated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="space-y-4">
                    <Skeleton className="aspect-[3/4] rounded-xl" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <p className="text-destructive mb-4">Failed to load products</p>
                <p className="text-muted-foreground text-sm">{error}</p>
              </div>
            ) : sortedProducts.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground">No products found in this category.</p>
                <Link to="/products" className="text-primary hover:underline mt-4 inline-block">
                  View all products
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
                {sortedProducts.map((product, i) => (
                  <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="group">
                    <Link to={`/product/${product.id}`} className="block">
                      <div className="relative overflow-hidden rounded-xl bg-muted aspect-[3/4]">
                        <img src={product.images[0] || "/placeholder.svg"} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        {product.discount && <span className="absolute top-3 left-3 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 rounded">-{product.discount}%</span>}
                        {product.isNew && <span className="absolute top-3 right-3 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded">NEW</span>}
                      </div>
                      <div className="mt-4">
                        <h3 className="font-medium text-sm truncate">{product.name}</h3>
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="h-3 w-3 fill-primary text-primary" />
                          <span className="text-xs text-muted-foreground">{product.rating}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="font-bold text-primary">{formatPrice(product.price)}</span>
                          {product.originalPrice && <span className="text-sm text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;
