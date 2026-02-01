import { Link } from "react-router-dom";
import { Minus, Plus, Trash2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/data/products";

const Cart = () => {
  const { items, removeItem, updateQuantity, subtotal } = useCart();
  const delivery = subtotal > 100000 ? 0 : 5000;
  const total = subtotal + delivery;

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="font-display text-3xl font-bold mb-4">Your Cart is Empty</h1>
        <p className="text-muted-foreground mb-8">Start shopping to add items to your cart.</p>
        <Button asChild><Link to="/products">Continue Shopping</Link></Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-display text-3xl font-bold mb-8">Shopping Cart</h1>
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.product.id} className="flex gap-4 p-4 bg-card rounded-xl border border-border">
              <img src={item.product.images[0]} alt={item.product.name} className="w-24 h-32 object-cover rounded-lg" />
              <div className="flex-1">
                <Link to={`/product/${item.product.id}`} className="font-medium hover:text-primary">{item.product.name}</Link>
                {(item.size || item.color) && <p className="text-sm text-muted-foreground mt-1">{item.size && `Size: ${item.size}`}{item.size && item.color && " • "}{item.color && `Color: ${item.color}`}</p>}
                <p className="font-bold text-primary mt-2">{formatPrice(item.product.price)}</p>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2 bg-muted rounded-lg">
                    <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="p-2"><Minus className="h-4 w-4" /></button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="p-2"><Plus className="h-4 w-4" /></button>
                  </div>
                  <button onClick={() => removeItem(item.product.id)} className="text-destructive p-2"><Trash2 className="h-5 w-5" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-card p-6 rounded-xl border border-border h-fit">
          <h2 className="font-display text-xl font-bold mb-4">Order Summary</h2>
          <div className="space-y-3 pb-4 border-b border-border">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatPrice(subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span>{delivery === 0 ? "Free" : formatPrice(delivery)}</span></div>
          </div>
          <div className="flex justify-between py-4 font-display text-xl font-bold"><span>Total</span><span className="text-primary">{formatPrice(total)}</span></div>
          <Button asChild className="w-full luxury-gradient text-primary-foreground font-semibold" size="lg"><Link to="/checkout">Proceed to Checkout <ArrowRight className="ml-2 h-5 w-5" /></Link></Button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
