import { useState } from "react";
import { motion } from "framer-motion";
import { Package, Plus, Edit, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatPrice } from "@/data/products";
import ProductFormDialog from "./ProductFormDialog";

interface AdminProductsProps {
  products: any[];
  onRefresh: () => void;
}

const AdminProducts = ({ products, onRefresh }: AdminProductsProps) => {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    const { error } = await supabase.from("products").delete().eq("id", productId);
    if (error) {
      toast({ title: "Error", description: "Failed to delete product.", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Product deleted successfully." });
      onRefresh();
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold">Products</h2>
          <p className="text-sm text-muted-foreground">{products.length} total products</p>
        </div>
        <Button
          onClick={() => { setEditingProduct(null); setProductDialogOpen(true); }}
          className="luxury-gradient text-primary-foreground"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search products by name or category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>{search ? "No products match your search." : "No products yet. Add your first product!"}</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 hover:border-primary/30 transition-colors"
            >
              <img
                src={product.images?.[0] || "/placeholder.svg"}
                alt={product.name}
                className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{product.name}</h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-sm text-muted-foreground capitalize">{product.category}</span>
                  {product.in_stock === false && <Badge variant="destructive" className="text-xs">Out of Stock</Badge>}
                  {product.featured && <Badge variant="secondary" className="text-xs">Featured</Badge>}
                  {product.is_new && <Badge className="text-xs bg-primary/20 text-primary">New</Badge>}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-bold text-primary">{formatPrice(product.price)}</span>
                  {product.original_price && (
                    <span className="text-sm text-muted-foreground line-through">{formatPrice(product.original_price)}</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button size="sm" variant="outline" onClick={() => { setEditingProduct(product); setProductDialogOpen(true); }}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDeleteProduct(product.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ProductFormDialog
        open={productDialogOpen}
        onOpenChange={setProductDialogOpen}
        product={editingProduct}
        onSuccess={onRefresh}
      />
    </motion.div>
  );
};

export default AdminProducts;
