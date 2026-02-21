import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/data/products";

interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_address: string;
  delivery_city: string;
  delivery_state: string;
  payment_method: string;
  payment_status: string;
  status: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  notes: string | null;
  created_at: string;
  
}

interface OrderItem {
  id: string;
  product_name: string;
  product_image: string | null;
  quantity: number;
  size: string | null;
  color: string | null;
  price: number;
}

interface OrderDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
}

const OrderDetailsDialog = ({
  open,
  onOpenChange,
  order,
}: OrderDetailsDialogProps) => {
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (open && order) {
      fetchOrderItems();
    }
  }, [open, order]);

  const fetchOrderItems = async () => {
    if (!order) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", order.id);
    if (!error && data) setOrderItems(data);
    setLoading(false);
  };


  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Order Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Info */}
          <div>
            <h3 className="font-semibold mb-2">Customer Information</h3>
            <div className="bg-muted/50 rounded-lg p-4 space-y-1">
              <p><span className="text-muted-foreground">Name:</span> {order.customer_name}</p>
              <p><span className="text-muted-foreground">Email:</span> {order.customer_email}</p>
              <p><span className="text-muted-foreground">Phone:</span> {order.customer_phone}</p>
            </div>
          </div>

          {/* Delivery Info */}
          <div>
            <h3 className="font-semibold mb-2">Delivery Information</h3>
            <div className="bg-muted/50 rounded-lg p-4 space-y-1">
              <p><span className="text-muted-foreground">Address:</span> {order.delivery_address}</p>
              <p><span className="text-muted-foreground">City:</span> {order.delivery_city}</p>
              <p><span className="text-muted-foreground">State:</span> {order.delivery_state}</p>
            </div>
          </div>

          {/* Order Items */}
          <div>
            <h3 className="font-semibold mb-2">Order Items</h3>
            {loading ? (
              <p className="text-muted-foreground">Loading items...</p>
            ) : orderItems.length === 0 ? (
              <p className="text-muted-foreground">No items found.</p>
            ) : (
              <div className="space-y-3">
                {orderItems.map((item) => (
                  <div key={item.id} className="flex gap-3 bg-muted/50 rounded-lg p-3">
                    {item.product_image && (
                      <img
                        src={item.product_image}
                        alt={item.product_name}
                        className="w-16 h-16 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{item.product_name}</p>
                      <div className="flex gap-2 mt-1">
                        {item.size && (
                          <Badge variant="secondary" className="text-xs">Size: {item.size}</Badge>
                        )}
                        {item.color && (
                          <Badge variant="secondary" className="text-xs">Color: {item.color}</Badge>
                        )}
                        <Badge variant="outline" className="text-xs">Qty: {item.quantity}</Badge>
                      </div>
                      <p className="text-primary font-bold mt-1">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment & Summary */}
          <div>
            <h3 className="font-semibold mb-2">Payment & Summary</h3>
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p><span className="text-muted-foreground">Payment Method:</span> {order.payment_method}</p>
              <p className="flex items-center gap-2">
                <span className="text-muted-foreground">Order Status:</span> 
                <Badge 
                  variant="secondary"
                  className={`${
                    order.status === "delivered" ? "bg-green-500/20 text-green-500" :
                    order.status === "dispatched" ? "bg-purple-500/20 text-purple-500" :
                    order.status === "processing" ? "bg-blue-500/20 text-blue-500" :
                    order.status === "cancelled" ? "bg-red-500/20 text-red-500" :
                    "bg-yellow-500/20 text-yellow-500"
                  }`}
                >
                  {order.status}
                </Badge>
              </p>
              <p className="flex items-center gap-2">
                <span className="text-muted-foreground">Payment Status:</span> 
                <Badge 
                  variant="secondary"
                  className={`${
                    order.payment_status === "confirmed" ? "bg-green-500/20 text-green-500" :
                    order.payment_status === "unsuccessful" ? "bg-red-500/20 text-red-500" :
                    "bg-yellow-500/20 text-yellow-500"
                  }`}
                >
                  {order.payment_status || "pending"}
                </Badge>
              </p>
              <div className="border-t border-border pt-2 mt-2">
                <p className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-muted-foreground">Delivery Fee:</span>
                  <span>{formatPrice(order.delivery_fee)}</span>
                </p>
                <p className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span className="text-primary">{formatPrice(order.total)}</span>
                </p>
              </div>
            </div>
          </div>


          {order.notes && (
            <div>
              <h3 className="font-semibold mb-2">Order Notes</h3>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-muted-foreground">{order.notes}</p>
              </div>
            </div>
          )}

          <p className="text-sm text-muted-foreground text-center">
            Order placed on {new Date(order.created_at).toLocaleString()}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailsDialog;
