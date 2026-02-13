import { useState, useCallback, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, CreditCard, Truck, Building2, Copy, ExternalLink, Loader2, MapPin, Upload, ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  const [paymentMethod, setPaymentMethod] = useState<"card" | "bank">("card");
  const [orderReference] = useState(() => `ABL-${Date.now().toString(36).toUpperCase()}`);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const receiptInputRef = useRef<HTMLInputElement>(null);
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
  
  // Calculate delivery fee based on selected state and city
  const [deliveryInfo, setDeliveryInfo] = useState<{
    fee: number;
    zone: DeliveryZone | null;
    estimatedDays: string;
  }>({ fee: 0, zone: null, estimatedDays: "" });

  // Update delivery fee whenever state or city changes
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

  const bankDetails = {
    bankName: "OPAY",
    accountNumber: "8022050740",
    accountName: "SULIYAT TITILOPE ABDULLAHI",
  };

  const handleInputChange = (field: keyof DeliveryFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setDeliveryData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const copyAccountNumber = async () => {
    try {
      await navigator.clipboard.writeText(bankDetails.accountNumber);
      toast({
        title: "Account Number Copied",
        description: "Account number copied to clipboard.",
      });
    } catch {
      toast({
        title: "Copy Failed",
        description: "Please copy manually: " + bankDetails.accountNumber,
        variant: "destructive",
      });
    }
  };

  const copyReferenceCode = async () => {
    try {
      await navigator.clipboard.writeText(orderReference);
      toast({
        title: "Reference Code Copied",
        description: "Reference code copied to clipboard.",
      });
    } catch {
      toast({
        title: "Copy Failed",
        description: "Please copy manually: " + orderReference,
        variant: "destructive",
      });
    }
  };

  const handleReceiptSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast({ title: "Invalid file", description: "Please upload an image file.", variant: "destructive" });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "File too large", description: "Receipt image must be under 5MB.", variant: "destructive" });
        return;
      }
      setReceiptFile(file);
      setReceiptPreview(URL.createObjectURL(file));
    }
  };

  const removeReceipt = () => {
    setReceiptFile(null);
    if (receiptPreview) URL.revokeObjectURL(receiptPreview);
    setReceiptPreview(null);
    if (receiptInputRef.current) receiptInputRef.current.value = "";
  };

  const uploadReceipt = async (orderId: string): Promise<string | null> => {
    if (!receiptFile || !user) return null;
    const ext = receiptFile.name.split(".").pop();
    const path = `${user.id}/${orderId}.${ext}`;
    const { error } = await supabase.storage.from("payment-receipts").upload(path, receiptFile);
    if (error) {
      console.error("Receipt upload error:", error);
      return null;
    }
    return path;
  };

  const saveOrderToDatabase = async () => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to place an order.",
        variant: "destructive",
      });
      navigate("/auth");
      return false;
    }

    setIsSubmitting(true);

    try {
      // Create the order
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
          payment_method: paymentMethod === "card" ? "Credit/Debit Card" : "Bank Transfer",
          subtotal: subtotal,
          delivery_fee: delivery,
          total: total,
          notes: `Order Reference: ${orderReference}`,
          status: "pending",
        })
        .select()
        .single();

      if (orderError) {
        console.error("Order error:", orderError);
        throw new Error(orderError.message);
      }

      // Create order items
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

      // Upload receipt if bank transfer
      if (paymentMethod === "bank" && receiptFile) {
        const receiptPath = await uploadReceipt(order.id);
        if (receiptPath) {
          await supabase.from("orders").update({ receipt_url: receiptPath }).eq("id", order.id);
        }
      }

      return true;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate state selection on step 1
    if (step === 1 && !deliveryData.state) {
      toast({
        title: "State Required",
        description: "Please select your state to calculate delivery fee.",
        variant: "destructive",
      });
      return;
    }
    
    
    if (step < 3) { 
      setStep(step + 1); 
      return; 
    }

    // Final step - place the order
    const success = await saveOrderToDatabase();
    
    if (success) {
      toast({ 
        title: "Order Placed!", 
        description: "Thank you for your order. Please allow some time for your payment to be verified and processed." 
      });
      clearCart();
      navigate("/");
    }
  };

  // Redirect to auth if not logged in
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="font-display text-3xl font-bold mb-4">Please Sign In</h1>
        <p className="text-muted-foreground mb-6">You need to be signed in to complete your checkout.</p>
        <Button asChild>
          <Link to="/auth">Sign In</Link>
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
      <div className="flex items-center justify-center mb-8 gap-4">
        {[{ n: 1, label: "Delivery" }, { n: 2, label: "Payment" }, { n: 3, label: "Review" }].map((s, i) => (
          <div key={s.n} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= s.n ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {step > s.n ? <Check className="h-4 w-4" /> : s.n}
            </div>
            <span className={step >= s.n ? "text-foreground" : "text-muted-foreground"}>{s.label}</span>
            {i < 2 && <div className={`w-12 h-0.5 ${step > s.n ? "bg-primary" : "bg-muted"}`} />}
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
                  <Input 
                    required 
                    value={deliveryData.firstName}
                    onChange={handleInputChange("firstName")}
                  />
                </div>
                <div>
                  <Label>Last Name</Label>
                  <Input 
                    required 
                    value={deliveryData.lastName}
                    onChange={handleInputChange("lastName")}
                  />
                </div>
              </div>
              <div>
                <Label>Email</Label>
                <Input 
                  type="email" 
                  required 
                  value={deliveryData.email}
                  onChange={handleInputChange("email")}
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input 
                  type="tel" 
                  required 
                  value={deliveryData.phone}
                  onChange={handleInputChange("phone")}
                />
              </div>
              <div>
                <Label>Address</Label>
                <Input 
                  required 
                  value={deliveryData.address}
                  onChange={handleInputChange("address")}
                />
              </div>
              {/* State Selection - Important for delivery fee calculation */}
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
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
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

              {/* Delivery Fee Preview */}
              {deliveryData.state && (
                <div className="p-4 bg-muted rounded-lg border border-border">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm mb-1">Delivery Estimate</h4>
                      <div className="space-y-1 text-sm">
                        <p className="text-muted-foreground">
                          <span className="font-medium text-foreground">From:</span> OKI, Ibadan
                        </p>
                        <p className="text-muted-foreground">
                          <span className="font-medium text-foreground">To:</span> {deliveryData.city || "Your city"}, {deliveryData.state}
                        </p>
                        {deliveryInfo.zone && (
                          <>
                            <p className="text-muted-foreground">
                              <span className="font-medium text-foreground">Zone:</span> {deliveryInfo.zone.name}
                            </p>
                            <p className="text-muted-foreground">
                              <span className="font-medium text-foreground">Estimated delivery:</span> {deliveryInfo.estimatedDays}
                            </p>
                          </>
                        )}
                        <p className="font-semibold text-primary pt-1">
                          Delivery Fee: {delivery === 0 ? "FREE" : formatPrice(delivery)}
                          {subtotal >= 100000 && delivery === 0 && (
                            <span className="text-xs text-muted-foreground ml-2">(Orders above ₦100,000)</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <Label>Postal Code (Optional)</Label>
                <Input 
                  value={deliveryData.postalCode}
                  onChange={handleInputChange("postalCode")}
                  placeholder="e.g. 200001"
                />
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="font-display text-xl font-bold flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" /> Payment Method
              </h2>
              
              <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as "card" | "bank")} className="space-y-4">
                <div className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${paymentMethod === "card" ? "border-primary bg-primary/5" : "border-border"}`}>
                  <RadioGroupItem value="card" id="card" />
                  <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer flex-1">
                    <CreditCard className="h-5 w-5" />
                    <span>Credit/Debit Card</span>
                  </Label>
                </div>
                <div className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${paymentMethod === "bank" ? "border-primary bg-primary/5" : "border-border"}`}>
                  <RadioGroupItem value="bank" id="bank" />
                  <Label htmlFor="bank" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Building2 className="h-5 w-5" />
                    <span>Bank Transfer</span>
                  </Label>
                </div>
              </RadioGroup>

              {paymentMethod === "card" && (
                <div className="space-y-4 pt-4 border-t border-border">
                  <div><Label>Card Number</Label><Input placeholder="1234 5678 9012 3456" required /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Expiry Date</Label><Input placeholder="MM/YY" required /></div>
                    <div><Label>CVV</Label><Input placeholder="123" required /></div>
                  </div>
                  <div><Label>Name on Card</Label><Input required /></div>
                </div>
              )}

              {paymentMethod === "bank" && (
                <div className="space-y-4 pt-4 border-t border-border">
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">Bank Transfer Details</h3>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                        Ref: {orderReference}
                      </span>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Bank Name:</span>
                        <span className="font-medium">{bankDetails.bankName}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Account Number:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium font-mono text-base">{bankDetails.accountNumber}</span>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 w-7 p-0"
                            onClick={copyAccountNumber}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Account Name:</span>
                        <span className="font-medium text-right">{bankDetails.accountName}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-border/50">
                        <span className="text-muted-foreground">Amount to Pay:</span>
                        <span className="font-bold text-primary text-lg">{formatPrice(total)}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/10">
                      <p className="text-xs text-muted-foreground">
                        <strong className="text-foreground">Important:</strong> Use the reference code below as your payment reference/description to help us identify your payment quickly.
                      </p>
                    </div>

                    {/* Copy Buttons */}
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        className="gap-2"
                        onClick={copyReferenceCode}
                      >
                        <Copy className="h-4 w-4" />
                        Copy Reference
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        className="gap-2"
                        onClick={copyAccountNumber}
                      >
                        <Copy className="h-4 w-4" />
                        Copy Account No.
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          {step === 3 && (
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

              {/* Payment Method Summary */}
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold text-sm mb-1">Payment Method</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  {paymentMethod === "card" ? <CreditCard className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                  {paymentMethod === "card" ? "Credit/Debit Card" : "Bank Transfer"}
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
          <div className="flex flex-col gap-3 mt-6">
            {/* Payment Confirmation + Receipt Upload for Bank Transfer on Review Step */}
            {step === 3 && paymentMethod === "bank" && (
              <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/30">
                {!paymentConfirmed ? (
                  <Button 
                    type="button" 
                    variant="outline"
                    className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                    onClick={() => setPaymentConfirmed(true)}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    I Have Made Payment
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-primary">
                      <Check className="h-4 w-4" />
                      Payment confirmed — now upload your receipt
                    </div>
                    
                    <input 
                      ref={receiptInputRef}
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleReceiptSelect} 
                    />

                    {!receiptFile ? (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full border-dashed border-2 h-24 flex-col gap-2"
                        onClick={() => receiptInputRef.current?.click()}
                      >
                        <Upload className="h-6 w-6 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Click to upload payment receipt</span>
                      </Button>
                    ) : (
                      <div className="relative border border-border rounded-lg overflow-hidden">
                        <img src={receiptPreview!} alt="Receipt" className="w-full max-h-48 object-contain bg-background" />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-7 w-7"
                          onClick={removeReceipt}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <div className="p-2 bg-muted text-xs text-muted-foreground flex items-center gap-1">
                          <ImageIcon className="h-3 w-3" />
                          {receiptFile.name}
                        </div>
                      </div>
                    )}
                    
                    {!receiptFile && (
                      <p className="text-xs text-destructive">* You must upload your payment receipt to place your order</p>
                    )}
                  </div>
                )}
              </div>
            )}
            
            <div className="flex gap-3">
              {step > 1 && (
                <Button type="button" variant="outline" onClick={() => setStep(step - 1)} disabled={isSubmitting}>
                  Back
                </Button>
              )}
              <Button 
                type="submit" 
                className="flex-1 luxury-gradient text-primary-foreground font-semibold"
                disabled={isSubmitting || (step === 3 && paymentMethod === "bank" && (!paymentConfirmed || !receiptFile))}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  step === 3 ? "Place Order" : "Continue"
                )}
              </Button>
            </div>
          </div>
          
        </form>

        <div className="bg-card p-6 rounded-xl border border-border h-fit">
          <h2 className="font-display text-xl font-bold mb-4">Order Summary</h2>
          <div className="space-y-3 pb-4 border-b border-border">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal ({totalItems} items)</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Delivery</span>
              <div className="text-right">
                <span>{delivery === 0 ? "Free" : formatPrice(delivery)}</span>
                {deliveryInfo.zone && delivery > 0 && (
                  <p className="text-xs text-muted-foreground">{deliveryInfo.estimatedDays}</p>
                )}
                {!deliveryData.state && (
                  <p className="text-xs text-muted-foreground">Select state to calculate</p>
                )}
              </div>
            </div>
            {subtotal >= 100000 && (
              <p className="text-xs text-green-600 font-medium">
                ✓ Free delivery on orders above ₦100,000!
              </p>
            )}
          </div>
          <div className="flex justify-between py-4 font-display text-xl font-bold">
            <span>Total</span>
            <span className="text-primary">{formatPrice(total)}</span>
          </div>
          
          {/* Delivery origin info */}
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