import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, CreditCard, Truck, Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { formatPrice } from "@/data/products";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getAllStates, calculateDeliveryFee, DeliveryZone } from "@/lib/deliveryFees";

interface DeliveryFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
}

const Checkout = () => {
  const { items, subtotal, clearCart, totalItems } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isInitializingPayment, setIsInitializingPayment] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deliveryData, setDeliveryData] = useState<DeliveryFormData>({
    firstName: "",
    lastName: "",
    email: user?.email || "",
    phone: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
  });
  
  const [deliveryInfo, setDeliveryInfo] = useState<{
    fee: number;
    zone: DeliveryZone | null;
    estimatedDays: string;
  }>({ fee: 0, zone: null, estimatedDays: "" });

  useEffect(() => {
    if (deliveryData.state) {
      const info = calculateDeliveryFee(
        deliveryData.state, 
        deliveryData.city, 
        subtotal,
        totalItems
      );
      setDeliveryInfo(info);
    }
  }, [deliveryData.state, deliveryData.city, subtotal, totalItems]);
  
  const delivery = deliveryInfo.fee;
  const total = subtotal + delivery;

  const handleInputChange = (field: keyof DeliveryFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setDeliveryData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const saveOrderToDatabase = async (): Promise<string | false> => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to place an order.",
        variant: "destructive",
      });
      navigate("/auth?redirect=/checkout");
      return false;
    }

    setIsSubmitting(true);

    try {
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          customer_name: `${deliveryData.firstName} ${deliveryData.lastName}`.trim(),
          customer_email: deliveryData.email,
          customer_phone: deliveryData.phone,
          delivery_address: deliveryData.address,
          delivery_city: deliveryData.city,
          delivery_state: deliveryData.state,
          payment_method: "Paystack",
          subtotal: subtotal,
          delivery_fee: delivery,
          total: total,
          status: "pending",
        })
        .select()
        .single();

      if (orderError) {
        console.error("Order error:", orderError);
        throw new Error(orderError.message);
      }

      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        product_name: item.product.name,
        product_image: item.product.images?.[0] || null,
        quantity: item.quantity,
        price: item.product.price,
        size: item.size || null,
        color: item.color || null,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) {
        console.error("Order items error:", itemsError);
        throw new Error(itemsError.message);
      }

      return order.id;
    } catch (error) {
      console.error("Error saving order:", error);
      toast({
        title: "Order Failed",
        description: error instanceof Error ? error.message : "Failed to place order. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const initializePaystackPayment = async (orderId: string) => {
    setIsInitializingPayment(true);
    try {
      const { data, error } = await supabase.functions.invoke("initialize-payment", {
        body: {
          email: deliveryData.email,
          amount: total,
          orderId,
          callbackUrl: `${window.location.origin}/payment-success`,
        },
      });

      if (error) throw error;
      if (data?.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        throw new Error("No payment URL received");
      }
    } catch (error) {
      console.error("Payment initialization error:", error);
      toast({
        title: "Payment Error",
        description: "Failed to initialize payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsInitializingPayment(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step === 1 && !deliveryData.state) {
      toast({
        title: "State Required",
        description: "Please select your state to calculate delivery fee.",
        variant: "destructive",
      });
      return;
    }
    
    if (step < 2) { 
      setStep(step + 1); 
      return; 
    }

    // Final step - place the order and redirect to Paystack
    const orderId = await saveOrderToDatabase();
    if (!orderId) return;
    await initializePaystackPayment(orderId);
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="font-display text-3xl font-bold mb-4">Please Sign In</h1>
        <p className="text-muted-foreground mb-6">You need to be signed in to complete your checkout.</p>
        <Button asChild>
          <Link to="/auth?redirect=/checkout">Sign In</Link>
        </Button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="font-display text-3xl font-bold mb-4">No items to checkout</h1>
        <Button asChild>
          <Link to="/products">Continue Shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-display text-3xl font-bold mb-8">Checkout</h1>

      {/* Steps */}
      <div className="flex items-center justify-center mb-8 gap-1 sm:gap-3 w-full overflow-hidden px-2">
        {[{ n: 1, label: "Delivery" }, { n: 2, label: "Review & Pay" }].map((s, i) => (
          <div key={s.n} className="flex items-center gap-1 sm:gap-2 shrink-0">
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm ${step >= s.n ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {step > s.n ? <Check className="h-3.5 w-3.5" /> : s.n}
            </div>
            <span className={`text-xs sm:text-sm ${step >= s.n ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</span>
            {i < 1 && <div className={`w-6 sm:w-12 h-0.5 ${step > s.n ? "bg-primary" : "bg-muted"}`} />}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <form onSubmit={handleSubmit} className="lg:col-span-2 bg-card p-6 rounded-xl border border-border">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-display text-xl font-bold flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" /> Delivery Information
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>First Name</Label>
                  <Input required value={deliveryData.firstName} onChange={handleInputChange("firstName")} />
                </div>
                <div>
                  <Label>Last Name</Label>
                  <Input required value={deliveryData.lastName} onChange={handleInputChange("lastName")} />
                </div>
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" required value={deliveryData.email} onChange={handleInputChange("email")} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input type="tel" required value={deliveryData.phone} onChange={handleInputChange("phone")} />
              </div>
              <div>
                <Label>Address</Label>
                <Input required value={deliveryData.address} onChange={handleInputChange("address")} />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>State *</Label>
                  <Select
                    value={deliveryData.state}
                    onValueChange={(value) => setDeliveryData(prev => ({ ...prev, state: value }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select your state" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAllStates().map((state) => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>City/Town *</Label>
                  <Input 
                    required 
                    placeholder={deliveryData.state === "Oyo" ? "e.g. Ibadan, Oyo, Ogbomoso" : "Enter your city"}
                    value={deliveryData.city}
                    onChange={handleInputChange("city")}
                  />
                </div>
              </div>
              <div>
                <Label>Postal Code (Optional)</Label>
                <Input value={deliveryData.postalCode} onChange={handleInputChange("postalCode")} placeholder="e.g. 200001" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-display text-xl font-bold">Review Your Order</h2>
              
              {/* Delivery Summary */}
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <h3 className="font-semibold text-sm">Delivery Details</h3>
                <p className="text-sm">{deliveryData.firstName} {deliveryData.lastName}</p>
                <p className="text-sm text-muted-foreground">{deliveryData.address}</p>
                <p className="text-sm text-muted-foreground">{deliveryData.city}, {deliveryData.state}</p>
                <p className="text-sm text-muted-foreground">{deliveryData.phone}</p>
              </div>

              {/* Payment Info */}
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold text-sm mb-1">Payment</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Secure payment via Paystack (Card, Bank Transfer, or USSD)
                </p>
              </div>

              {/* Order Items */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Order Items</h3>
                {items.map((item) => (
                  <div key={item.product.id} className="flex gap-3 p-3 bg-muted rounded-lg">
                    <img src={item.product.images[0]} alt="" className="w-16 h-20 object-cover rounded" />
                    <div className="flex-1">
                      <p className="font-medium">{item.product.name}</p>
                      <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                      {item.size && <p className="text-xs text-muted-foreground">Size: {item.size}</p>}
                      {item.color && <p className="text-xs text-muted-foreground">Color: {item.color}</p>}
                    </div>
                    <span className="font-bold text-primary">{formatPrice(item.product.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            {step > 1 && (
              <Button type="button" variant="outline" onClick={() => setStep(step - 1)} disabled={isSubmitting}>
                Back
              </Button>
            )}
            <Button 
              type="submit" 
              className="flex-1 luxury-gradient text-primary-foreground font-semibold"
              disabled={isSubmitting || isInitializingPayment}
            >
              {isSubmitting || isInitializingPayment ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {isInitializingPayment ? "Redirecting to Paystack..." : "Processing..."}
                </>
              ) : (
                step === 2 ? "Pay Now" : "Continue"
              )}
            </Button>
          </div>
        </form>

        <div className="bg-card p-6 rounded-xl border border-border h-fit">
          <h2 className="font-display text-xl font-bold mb-4">Order Summary</h2>
          <div className="space-y-3 pb-4 border-b border-border">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal ({totalItems} items)</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
          </div>
          <div className="flex justify-between py-4 font-display text-xl font-bold">
            <span>Total</span>
            <span className="text-primary">{formatPrice(subtotal)}</span>
          </div>
          
          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              Dispatched from OKI, Ibadan, Oyo State
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
