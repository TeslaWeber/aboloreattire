import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Star, Heart, Sparkles, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { categories, formatPrice } from "@/data/products";
import { useFeaturedProducts } from "@/hooks/useProducts";
import { useAuth } from "@/context/AuthContext";
import HeroCarousel from "@/components/home/HeroCarousel";
import { Skeleton } from "@/components/ui/skeleton";
import { useWishlist } from "@/context/WishlistContext";

const Index = () => {
  const { products: featuredProducts, loading } = useFeaturedProducts();
  const { toggleItem, isInWishlist } = useWishlist();
  const { user } = useAuth();
  const [visibleCount, setVisibleCount] = useState(10);
  
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Valued Customer';

  const exploreOptions = [
    { label: "Explore Men's", link: "/products?category=men" },
    { label: "Explore Women's", link: "/products?category=women" },
    { label: "Explore Kids'", link: "/products?category=kids" },
    { label: "Explore Shoes", link: "/products?category=shoes" },
    { label: "Explore Bags", link: "/products?category=bags" },
    { label: "Explore Jewelry", link: "/products?category=jewelry" },
  ];
  const [exploreIndex, setExploreIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setExploreIndex((prev) => (prev + 1) % exploreOptions.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [exploreOptions.length]);

  return (
    <div>
      {/* Personalized Greeting */}
      {user && (
        <section className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-border">
          <div className="container mx-auto px-4 py-3">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Welcome back,</p>
                <p className="font-display text-sm font-medium text-foreground">{userName}</p>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Hero Section */}
      <section className="relative h-[75vh] lg:h-[80vh] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/60 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/30 z-10" />
        <HeroCarousel />
        <div className="relative z-20 container mx-auto px-4 h-full flex items-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="max-w-xl"
          >
            <h1 className="font-display text-4xl lg:text-6xl xl:text-7xl font-bold mb-6 leading-[1.1]">
              Elevate Your <span className="luxury-text-gradient">Street Style</span>
            </h1>
            <p className="text-base lg:text-lg text-muted-foreground mb-8 max-w-md leading-relaxed">
              Discover curated streetwear and casual fashion for the modern trendsetter.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="luxury-gradient text-primary-foreground font-semibold px-8">
                <Link to="/products">Shop Now <ArrowRight className="ml-2 h-5 w-5" /></Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-primary/30 hover:bg-primary/10 min-w-[160px]">
                <Link to={exploreOptions[exploreIndex].link}>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={exploreIndex}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                    >
                      {exploreOptions[exploreIndex].label}
                    </motion.span>
                  </AnimatePresence>
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 lg:py-24 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-xs font-medium text-primary tracking-[0.2em] uppercase mb-3"
            >
              Browse Collections
            </motion.p>
            <h2 className="font-display text-3xl lg:text-4xl font-bold">
              Shop by <span className="luxury-text-gradient">Category</span>
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-5">
            {categories.map((cat, i) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                viewport={{ once: true }}
              >
                <Link
                  to={`/products?category=${cat.id}`}
                  className="group block relative overflow-hidden rounded-2xl luxury-hover"
                >
                  <div className="aspect-[3/4]">
                    <img src={cat.image} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="font-display text-sm lg:text-base font-semibold text-foreground">{cat.name}</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {cat.subcategories.length} styles
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-medium text-primary tracking-[0.2em] uppercase mb-3">Curated For You</p>
              <h2 className="font-display text-2xl lg:text-3xl font-bold">
                Featured <span className="luxury-text-gradient">Products</span>
              </h2>
            </div>
            <Button asChild variant="ghost" className="text-primary hover:text-primary/80 hidden md:inline-flex">
              <Link to="/products">View All <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="aspect-[3/4] rounded-2xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : featuredProducts.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border border-border/50 bg-card/30">
              <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No featured products yet.</p>
              <Button asChild>
                <Link to="/products">Browse All Products</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
              {featuredProducts.slice(0, visibleCount).map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  viewport={{ once: true }}
                  className="group"
                >
                  <Link to={`/product/${product.id}`} className="block">
                    <div className="relative overflow-hidden rounded-2xl bg-muted aspect-[3/4]">
                      <img src={product.images[0] || "/placeholder.svg"} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      {product.discount && (
                        <span className="absolute top-3 left-3 bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-1 rounded-lg">
                          -{product.discount}%
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          toggleItem({ id: product.id, name: product.name, price: product.price, originalPrice: product.originalPrice, image: product.images[0] || "/placeholder.svg", discount: product.discount });
                        }}
                        className="absolute bottom-3 right-3 p-2 bg-background/70 backdrop-blur-md rounded-full hover:bg-background transition-all duration-200 hover:scale-110"
                      >
                        <Heart className={`h-4 w-4 ${isInWishlist(product.id) ? "fill-primary text-primary" : "text-foreground/70"}`} />
                      </button>
                    </div>
                    <div className="mt-3 px-0.5">
                      <h3 className="font-medium text-sm lg:text-base truncate">{product.name}</h3>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="h-3 w-3 fill-primary text-primary" />
                        <span className="text-xs text-muted-foreground">{product.rating} ({product.reviewCount})</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="font-bold text-sm text-primary">{formatPrice(product.price)}</span>
                        {product.originalPrice && (
                          <span className="text-xs text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
          {!loading && featuredProducts.length > visibleCount && (
            <div className="flex justify-center mt-12">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setVisibleCount((prev) => prev + 10)}
                className="font-semibold border-primary/30 hover:bg-primary/10 px-10"
              >
                Load More
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Index;
