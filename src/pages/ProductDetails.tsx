import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { Star, Minus, Plus, Heart, Truck, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/data/products";
import { useProduct } from "@/hooks/useProducts";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import ImageGallery from "@/components/product/ImageGallery";
import AuthRequiredDialog from "@/components/auth/AuthRequiredDialog";
import { Skeleton } from "@/components/ui/skeleton";

const ProductDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const { product, loading, error } = useProduct(id || "");
  const { addItem } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [authDialogOpen, setAuthDialogOpen] = useState(false);

  // Scroll to top when product changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id, location.pathname]);

  // Set default size and color when product loads
  useEffect(() => {
    if (product) {
      setSelectedSize(product.sizes?.[0] || "");
      setSelectedColor(product.colors?.[0]?.name || "");
    }
  }, [product]);

  if (loading) {
    return (
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            <Skeleton className="aspect-square rounded-xl" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-10 w-1/3" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Product not found</h1>
        <p className="text-muted-foreground mb-6">{error || "The product you're looking for doesn't exist."}</p>
        <Link to="/products" className="text-primary hover:underline">Back to Products</Link>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (!user) {
      setAuthDialogOpen(true);
      return;
    }
    addItem(product, quantity, selectedSize, selectedColor);
    toast({ title: "Added to cart", description: `${product.name} has been added to your cart.` });
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary">Home</Link> / <Link to="/products" className="hover:text-primary">Products</Link> / <span className="text-foreground">{product.name}</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Images with Zoom */}
          <ImageGallery images={product.images} productName={product.name} />

          {/* Details */}
          <div>
            {product.isNew && <span className="inline-block px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded mb-3">NEW ARRIVAL</span>}
            <h1 className="font-display text-3xl lg:text-4xl font-bold mb-4">{product.name}</h1>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex">{[...Array(5)].map((_, i) => <Star key={i} className={`h-5 w-5 ${i < Math.floor(product.rating) ? "fill-primary text-primary" : "text-muted"}`} />)}</div>
              <span className="text-muted-foreground">({product.reviewCount} reviews)</span>
            </div>
            <div className="flex items-center gap-3 mb-6">
              <span className="font-display text-3xl font-bold text-primary">{formatPrice(product.price)}</span>
              {product.originalPrice && <span className="text-xl text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>}
              {product.discount && <span className="px-2 py-1 bg-destructive text-destructive-foreground text-sm font-bold rounded">-{product.discount}%</span>}
            </div>
            <p className="text-muted-foreground mb-6">{product.description}</p>

            {product.sizes && product.sizes.length > 0 && (
              <div className="mb-6">
                <label className="block font-medium mb-2">Size</label>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button key={size} onClick={() => setSelectedSize(size)} className={`px-4 py-2 rounded-lg border transition-colors ${selectedSize === size ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary"}`}>{size}</button>
                  ))}
                </div>
              </div>
            )}

            {product.colors && product.colors.length > 0 && (
              <div className="mb-6">
                <label className="block font-medium mb-2">Color: {selectedColor}</label>
                <div className="flex gap-2">
                  {product.colors.map((color) => (
                    <button key={color.name} onClick={() => setSelectedColor(color.name)} className={`w-10 h-10 rounded-full border-2 ${selectedColor === color.name ? "border-primary" : "border-transparent"}`} style={{ backgroundColor: color.hex }} title={color.name} />
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-3 bg-muted rounded-lg p-2">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 hover:bg-background rounded"><Minus className="h-4 w-4" /></button>
                <span className="w-10 text-center font-medium">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="p-2 hover:bg-background rounded"><Plus className="h-4 w-4" /></button>
              </div>
            </div>

            <div className="flex gap-3 mb-8">
              <Button onClick={handleAddToCart} size="lg" className="flex-1 luxury-gradient text-primary-foreground font-semibold">Add to Cart</Button>
              <Button variant="outline" size="lg"><Heart className="h-5 w-5" /></Button>
            </div>

            <div className="space-y-3 pt-6 border-t border-border">
              <div className="flex items-center gap-3 text-sm"><Truck className="h-5 w-5 text-primary" /><span>Free delivery on orders over ₦100,000</span></div>
              <div className="flex items-center gap-3 text-sm"><Shield className="h-5 w-5 text-primary" /><span>3-day return policy</span></div>
            </div>
          </div>
        </div>
      </div>

      <AuthRequiredDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
    </div>
  );
};

export default ProductDetails;
