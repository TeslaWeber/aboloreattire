import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, Trash2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWishlist } from "@/context/WishlistContext";
import { formatPrice } from "@/data/products";

const Wishlist = () => {
  const { items, removeItem } = useWishlist();

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary">Home</Link> / <span className="text-foreground">Wishlist</span>
        </div>

        <h1 className="font-display text-3xl font-bold mb-8">
          My <span className="luxury-text-gradient">Wishlist</span>
        </h1>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Your wishlist is empty</h2>
            <p className="text-muted-foreground mb-6">Save items you love by tapping the heart icon.</p>
            <Button asChild className="luxury-gradient text-primary-foreground">
              <Link to="/products">Browse Products</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="group relative"
              >
                <Link to={`/product/${item.id}`} className="block">
                  <div className="relative overflow-hidden rounded-xl bg-muted aspect-[3/4]">
                    <img src={item.image || "/placeholder.svg"} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    {item.discount && (
                      <span className="absolute top-3 left-3 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 rounded">
                        -{item.discount}%
                      </span>
                    )}
                  </div>
                  <div className="mt-4">
                    <h3 className="font-medium text-sm truncate">{item.name}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="font-bold text-primary">{formatPrice(item.price)}</span>
                      {item.originalPrice && <span className="text-sm text-muted-foreground line-through">{formatPrice(item.originalPrice)}</span>}
                    </div>
                  </div>
                </Link>
                <button
                  onClick={() => removeItem(item.id)}
                  className="absolute top-3 right-3 p-2 bg-background/80 backdrop-blur-sm rounded-full hover:bg-destructive hover:text-destructive-foreground transition-colors"
                  title="Remove from wishlist"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
