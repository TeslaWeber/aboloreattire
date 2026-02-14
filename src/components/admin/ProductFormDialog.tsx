import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { categories } from "@/data/products";
import { Upload, X, Image as ImageIcon, Loader2, Wand2 } from "lucide-react";
import ImageTransformDialog from "./ImageTransformDialog";

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: any | null;
  onSuccess: () => void;
}

const ProductFormDialog = ({
  open,
  onOpenChange,
  product,
  onSuccess,
}: ProductFormDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [transformDialogOpen, setTransformDialogOpen] = useState(false);
  const [transformingImageIndex, setTransformingImageIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    original_price: "",
    discount: "",
    category: "",
    subcategory: "",
    sizes: "",
    images: [] as string[],
    in_stock: true,
    featured: false,
    is_new: false,
    is_best_seller: false,
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        description: product.description || "",
        price: product.price?.toString() || "",
        original_price: product.original_price?.toString() || "",
        discount: product.discount?.toString() || "",
        category: product.category || "",
        subcategory: product.subcategory || "",
        sizes: product.sizes?.join(", ") || "",
        images: product.images || [],
        in_stock: product.in_stock ?? true,
        featured: product.featured ?? false,
        is_new: product.is_new ?? false,
        is_best_seller: product.is_best_seller ?? false,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        price: "",
        original_price: "",
        discount: "",
        category: "",
        subcategory: "",
        sizes: "",
        images: [],
        in_stock: true,
        featured: false,
        is_new: false,
        is_best_seller: false,
      });
    }
  }, [product, open]);

  // Auto-calculate discount when price or original_price changes
  useEffect(() => {
    const price = parseFloat(formData.price);
    const originalPrice = parseFloat(formData.original_price);
    
    if (originalPrice > 0 && price > 0 && originalPrice > price) {
      const discount = Math.round(((originalPrice - price) / originalPrice) * 100);
      setFormData(prev => ({ ...prev, discount: discount.toString() }));
    } else if (!formData.original_price || parseFloat(formData.original_price) <= parseFloat(formData.price)) {
      setFormData(prev => ({ ...prev, discount: "" }));
    }
  }, [formData.price, formData.original_price]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    const newImageUrls: string[] = [];

    try {
      for (const file of Array.from(files)) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast({
            title: "Invalid file",
            description: `${file.name} is not an image file.`,
            variant: "destructive",
          });
          continue;
        }

        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `products/${fileName}`;

        // Upload to Supabase storage
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast({
            title: "Upload failed",
            description: `Failed to upload ${file.name}: ${uploadError.message}`,
            variant: "destructive",
          });
          continue;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        newImageUrls.push(publicUrl);
      }

      if (newImageUrls.length > 0) {
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, ...newImageUrls]
        }));
        toast({
          title: "Success",
          description: `${newImageUrls.length} image(s) uploaded successfully.`,
        });
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      toast({
        title: "Error",
        description: "An error occurred while uploading images.",
        variant: "destructive",
      });
    } finally {
      setUploadingImages(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = (indexToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const productData = {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      original_price: formData.original_price ? parseFloat(formData.original_price) : null,
      discount: formData.discount ? parseInt(formData.discount) : null,
      category: formData.category,
      subcategory: formData.subcategory || null,
      sizes: formData.sizes ? formData.sizes.split(",").map((s) => s.trim()) : [],
      images: formData.images,
      in_stock: formData.in_stock,
      featured: formData.featured,
      is_new: formData.is_new,
      is_best_seller: formData.is_best_seller,
    };

    let error;
    if (product) {
      const result = await supabase
        .from("products")
        .update(productData)
        .eq("id", product.id);
      error = result.error;
    } else {
      const result = await supabase
        .from("products")
        .insert(productData);
      error = result.error;
    }

    if (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to save product.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: product ? "Product updated successfully." : "Product created successfully.",
      });
      onSuccess();
      onOpenChange(false);
    }

    setLoading(false);
  };

  const selectedCategory = categories.find((c) => c.id === formData.category);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {product ? "Edit Product" : "Add New Product"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Product Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Price (₦) *</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="original_price">Original Price (₦)</Label>
              <Input
                id="original_price"
                type="number"
                value={formData.original_price}
                onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="discount">Discount (%) - Auto-calculated</Label>
            <Input
              id="discount"
              type="number"
              value={formData.discount}
              readOnly
              className="bg-muted"
              placeholder="Enter original price to auto-calculate"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value, subcategory: "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="subcategory">Subcategory</Label>
              <Select
                value={formData.subcategory}
                onValueChange={(value) => setFormData({ ...formData, subcategory: value })}
                disabled={!formData.category}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subcategory" />
                </SelectTrigger>
                <SelectContent>
                  {selectedCategory?.subcategories.map((sub) => (
                    <SelectItem key={sub} value={sub}>
                      {sub}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="sizes">Sizes (comma separated)</Label>
            <Input
              id="sizes"
              value={formData.sizes}
              onChange={(e) => setFormData({ ...formData, sizes: e.target.value })}
              placeholder="S, M, L, XL"
            />
          </div>

          {/* Image Upload Section */}
          <div>
            <Label>Product Images</Label>
            <div className="mt-2 space-y-3">
              {/* Upload Button */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
                {uploadingImages ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Uploading...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload images from your device
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Supports: JPG, PNG, GIF, WEBP
                    </p>
                  </div>
                )}
              </div>

              {/* Image Preview Grid */}
              {formData.images.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {formData.images.map((imageUrl, index) => (
                    <div key={index} className="relative group aspect-square">
                      <img
                        src={imageUrl}
                        alt={`Product image ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => {
                            setTransformingImageIndex(index);
                            setTransformDialogOpen(true);
                          }}
                          className="bg-primary text-primary-foreground rounded-full p-1"
                          title="AI Transform"
                        >
                          <Wand2 className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="bg-destructive text-destructive-foreground rounded-full p-1"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {formData.images.length === 0 && (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  No images added yet
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="in_stock"
                checked={formData.in_stock}
                onCheckedChange={(checked) => setFormData({ ...formData, in_stock: !!checked })}
              />
              <Label htmlFor="in_stock">In Stock</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="featured"
                checked={formData.featured}
                onCheckedChange={(checked) => setFormData({ ...formData, featured: !!checked })}
              />
              <Label htmlFor="featured">Featured</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="is_new"
                checked={formData.is_new}
                onCheckedChange={(checked) => setFormData({ ...formData, is_new: !!checked })}
              />
              <Label htmlFor="is_new">New Arrival</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="is_best_seller"
                checked={formData.is_best_seller}
                onCheckedChange={(checked) => setFormData({ ...formData, is_best_seller: !!checked })}
              />
              <Label htmlFor="is_best_seller">Best Seller</Label>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || uploadingImages}
              className="flex-1 luxury-gradient text-primary-foreground"
            >
              {loading ? "Saving..." : product ? "Update Product" : "Add Product"}
            </Button>
          </div>
        </form>
      </DialogContent>

      {transformingImageIndex !== null && (
        <ImageTransformDialog
          open={transformDialogOpen}
          onOpenChange={(open) => {
            setTransformDialogOpen(open);
            if (!open) setTransformingImageIndex(null);
          }}
          imageUrl={formData.images[transformingImageIndex]}
          onTransformed={(newUrl) => {
            setFormData((prev) => ({
              ...prev,
              images: [...prev.images, newUrl],
            }));
          }}
        />
      )}
    </Dialog>
  );
};

export default ProductFormDialog;
