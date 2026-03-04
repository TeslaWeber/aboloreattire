import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, CreditCard, Truck, Loader2, MapPin, Upload, ImageIcon } from "lucide-react";
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
  const [paymentMode, setPaymentMode] = useState<string>("paystack");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  // Fetch payment mode from settings
  useEffect(() => {
    const fetchPaymentMode = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "payment_mode")
        .maybeSingle();
      if (data) setPaymentMode(data.value);
    };
    fetchPaymentMode();
  }, []);

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

  const handleReceiptSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload an image file.", variant: "destructive" });
      return;
    }
    setReceiptFile(file);
    setReceiptPreview(URL.createObjectURL(file));
  };

  const uploadReceiptAndSubmit = async (): Promise<string | false> => {
    if (!user) {
      toast({ title: "Please sign in", description: "You need to be signed in to place an order.", variant: "destructive" });
      navigate("/auth?redirect=/checkout");
      return false;
    }
    if (!receiptFile) {
      toast({ title: "Receipt required", description: "Please upload your payment receipt screenshot.", variant: "destructive" });
      return false;
    }

    setUploadingReceipt(true);
    try {
      // Save order first
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
          payment_method: "Receipt Upload",
          subtotal,
          delivery_fee: delivery,
          total,
          status: "pending",
          payment_status: "pending",
        })
        .select()
        .single();

      if (orderError) throw new Error(orderError.message);

      // Upload receipt
      const fileExt = receiptFile.name.split(".").pop();
      const fileName = `${order.id}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("payment-receipts")
        .upload(fileName, receiptFile);

      if (uploadError) throw new Error(uploadError.message);

      // Store the file path (not public URL) since bucket is private
      await supabase.from("orders").update({ receipt_url: fileName }).eq("id", order.id);

      // Save order items
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

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
      if (itemsError) throw new Error(itemsError.message);

      // Send admin notification
      supabase.functions.invoke("notify-admin-order", {
        body: {
          orderId: order.id,
          customerName: `${deliveryData.firstName} ${deliveryData.lastName}`.trim(),
          customerEmail: deliveryData.email,
          customerPhone: deliveryData.phone,
          total,
          paymentMethod: "Receipt Upload",
          deliveryState: deliveryData.state,
          deliveryCity: deliveryData.city,
          items: orderItems,
        },
      }).catch(() => {});

      // Send customer order confirmation email
      supabase.functions.invoke("notify-customer-status", {
        body: {
          customerEmail: deliveryData.email,
          customerName: `${deliveryData.firstName} ${deliveryData.lastName}`.trim(),
          orderId: order.id,
          changeType: "order_placed",
          newStatus: "order_placed",
          total,
          items: orderItems,
        },
      }).catch(() => {});

      // Send WhatsApp notifications
      supabase.functions.invoke("notify-whatsapp", {
        body: {
          orderId: order.id,
          customerName: `${deliveryData.firstName} ${deliveryData.lastName}`.trim(),
          customerPhone: deliveryData.phone,
          total,
          paymentMethod: "Receipt Upload",
          type: "new_order",
        },
      }).catch(() => {});

      clearCart();
      toast({ title: "Order Placed!", description: "Your order has been submitted. We'll verify your payment shortly." });
      navigate("/payment-success?method=receipt");
      return order.id;
    } catch (error) {
      toast({
        title: "Order Failed",
        description: error instanceof Error ? error.message : "Failed to place order.",
        variant: "destructive",
      });
      return false;
    } finally {
      setUploadingReceipt(false);
    }
  };

  const saveOrderToDatabase = async (): Promise<string | false> => {
    if (!user) {
      toast({ title: "Please sign in", description: "You need to be signed in to place an order.", variant: "destructive" });
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
          subtotal,
          delivery_fee: delivery,
          total,
          status: "pending",
        })
        .select()
        .single();

      if (orderError) throw new Error(orderError.message);

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

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
      if (itemsError) throw new Error(itemsError.message);

      // Send admin notification
      supabase.functions.invoke("notify-admin-order", {
        body: {
          orderId: order.id,
          customerName: `${deliveryData.firstName} ${deliveryData.lastName}`.trim(),
          customerEmail: deliveryData.email,
          customerPhone: deliveryData.phone,
          total,
          paymentMethod: "Paystack",
          deliveryState: deliveryData.state,
          deliveryCity: deliveryData.city,
          items: orderItems,
        },
      }).catch(() => {});

      // Send customer order confirmation email
      supabase.functions.invoke("notify-customer-status", {
        body: {
          customerEmail: deliveryData.email,
          customerName: `${deliveryData.firstName} ${deliveryData.lastName}`.trim(),
          orderId: order.id,
          changeType: "order_placed",
          newStatus: "order_placed",
          total,
          items: orderItems,
        },
      }).catch(() => {});

      // Send WhatsApp notifications
      supabase.functions.invoke("notify-whatsapp", {
        body: {
          orderId: order.id,
          customerName: `${deliveryData.firstName} ${deliveryData.lastName}`.trim(),
          customerPhone: deliveryData.phone,
          total,
          paymentMethod: "Paystack",
          type: "new_order",
        },
      }).catch(() => {});

      return order.id;
    } catch (error) {
      toast({
        title: "Order Failed",
        description: error instanceof Error ? error.message : "Failed to place order.",
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
      toast({ title: "Payment Error", description: "Failed to initialize payment. Please try again.", variant: "destructive" });
    } finally {
      setIsInitializingPayment(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step === 1 && !deliveryData.state) {
      toast({ title: "State Required", description: "Please select your state to calculate delivery fee.", variant: "destructive" });
      return;
    }
    
    if (step < 2) { 
      setStep(step + 1); 
      return; 
    }

    if (paymentMode === "receipt_upload") {
      await uploadReceiptAndSubmit();
    } else {
      const orderId = await saveOrderToDatabase();
      if (!orderId) return;
      await initializePaystackPayment(orderId);
    }
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
                {paymentMode === "paystack" ? (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Secure payment via Paystack (Card, Bank Transfer, or USSD)
                  </p>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3 bg-background rounded-lg border border-border space-y-1">
                      <p className="text-sm font-semibold">Transfer to this account:</p>
                      <p className="text-sm"><span className="text-muted-foreground">Bank:</span> JAIZ</p>
                      <p className="text-sm flex items-center gap-2">
                        <span className="text-muted-foreground">Acc. No:</span> 0017708379
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText("0017708379");
                            toast({ title: "Copied!", description: "Account number copied to clipboard." });
                          }}
                          className="text-primary hover:text-primary/80 transition-colors"
                          aria-label="Copy account number"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                        </button>
                      </p>
                      <p className="text-sm"><span className="text-muted-foreground">Acc. Name:</span> Suliyat Titilope</p>
                      <p className="text-sm font-semibold text-primary mt-2">Amount: {formatPrice(total)}</p>
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Upload a screenshot of your payment receipt
                    </p>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleReceiptSelect}
                        className="hidden"
                      />
                      {receiptPreview ? (
                        <div className="space-y-2">
                          <img
                            src={receiptPreview}
                            alt="Receipt preview"
                            className="max-h-48 mx-auto rounded-lg object-contain"
                          />
                          <p className="text-xs text-muted-foreground">Tap to change</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 py-2">
                          <Upload className="h-8 w-8 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">Tap to upload receipt screenshot</p>
                          <p className="text-xs text-muted-foreground">JPG, PNG supported</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
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
              disabled={isSubmitting || isInitializingPayment || uploadingReceipt}
            >
              {isSubmitting || isInitializingPayment || uploadingReceipt ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {uploadingReceipt ? "Submitting Order..." : isInitializingPayment ? "Redirecting to Paystack..." : "Processing..."}
                </>
              ) : (
                step === 2 ? (paymentMode === "paystack" ? "Pay Now" : "Submit Order") : "Continue"
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
            {delivery > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery</span>
                <span>{formatPrice(delivery)}</span>
              </div>
            )}
          </div>
          <div className="flex justify-between py-4 font-display text-xl font-bold">
            <span>Total</span>
            <span className="text-primary">{formatPrice(total)}</span>
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
