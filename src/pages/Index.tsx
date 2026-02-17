import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Star, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { categories, formatPrice } from "@/data/products";
import { useFeaturedProducts } from "@/hooks/useProducts";
import { useAuth } from "@/context/AuthContext";
import HeroCarousel from "@/components/home/HeroCarousel";
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  const { products: featuredProducts, loading } = useFeaturedProducts();
  const { user } = useAuth();
  
  // Get user's name from metadata or email
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Valued Customer';

  return (
    <div>
      {/* Personalized Greeting for Logged-in Users */}
      {user && (
        <section className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-border">
          <div className="container mx-auto px-4 py-4">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-full">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Welcome back,</p>
                  <p className="font-display font-semibold text-foreground">{userName}</p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Hero Section */}
      <section className="relative h-[70vh] lg:h-[85vh] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent z-10" />
        <HeroCarousel />
        <div className="relative z-20 container mx-auto px-4 h-full flex items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl"
          >
            <h1 className="font-display text-4xl lg:text-6xl xl:text-7xl font-bold mb-6 leading-tight">
              Elevate Your <span className="luxury-text-gradient">Style</span>
            </h1>
            <p className="text-lg lg:text-xl text-muted-foreground mb-8 max-w-lg">
              Discover curated luxury fashion and accessories for the modern connoisseur.
            </p>
            <Button asChild size="lg" className="luxury-gradient text-primary-foreground font-semibold">
              <Link to="/products">Shop Now <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 lg:py-24 bg-card">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-3xl lg:text-4xl font-bold text-center mb-12">
            Shop by <span className="luxury-text-gradient">Category</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-6">
            {categories.map((cat, i) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <Link
                  to={`/products?category=${cat.id}`}
                  className="group block relative overflow-hidden rounded-xl luxury-hover"
                >
                  <div className="aspect-square">
                    <img src={cat.image} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="font-display text-sm lg:text-base font-semibold text-white">{cat.name}</h3>
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
          <div className="flex justify-between items-center mb-12">
            <h2 className="font-display text-3xl lg:text-4xl font-bold">
              Featured <span className="luxury-text-gradient">Products</span>
            </h2>
            <Link to="/products" className="text-primary hover:underline flex items-center gap-1 whitespace-nowrap">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="aspect-[3/4] rounded-xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : featuredProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No featured products yet.</p>
              <Button asChild>
                <Link to="/products">Browse All Products</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
              {featuredProducts.slice(0, 8).map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  viewport={{ once: true }}
                  className="group"
                >
                  <Link to={`/product/${product.id}`} className="block">
                    <div className="relative overflow-hidden rounded-xl bg-muted aspect-[3/4]">
                      <img src={product.images[0] || "/placeholder.svg"} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      {product.discount && (
                        <span className="absolute top-3 left-3 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 rounded">
                          -{product.discount}%
                        </span>
                      )}
                      {product.isNew && (
                        <span className="absolute top-3 right-3 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded">
                          NEW
                        </span>
                      )}
                    </div>
                    <div className="mt-4">
                      <h3 className="font-medium text-sm lg:text-base truncate">{product.name}</h3>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="h-3 w-3 fill-primary text-primary" />
                        <span className="text-xs text-muted-foreground">{product.rating} ({product.reviewCount})</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="font-bold text-primary">{formatPrice(product.price)}</span>
                        {product.originalPrice && (
                          <span className="text-sm text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

    </div>
  );
};

export default Index;
