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
import { Mail, Phone, MapPin, ShoppingBag, ChevronRight } from "lucide-react";

interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
}

interface Order {
  id: string;
  customer_name: string;
  status: string;
  payment_status: string;
  total: number;
  created_at: string;
  payment_method: string;
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

interface CustomerOrdersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Profile | null;
}

const statusColor = (status: string) => {
  switch (status) {
    case "delivered": return "bg-green-500/20 text-green-600";
    case "dispatched": return "bg-purple-500/20 text-purple-600";
    case "processing": return "bg-blue-500/20 text-blue-600";
    case "cancelled": return "bg-red-500/20 text-red-600";
    default: return "bg-yellow-500/20 text-yellow-600";
  }
};

const CustomerOrdersDialog = ({ open, onOpenChange, customer }: CustomerOrdersDialogProps) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem[]>>({});

  useEffect(() => {
    if (open && customer) {
      fetchCustomerOrders();
      setExpandedOrder(null);
      setOrderItems({});
    }
  }, [open, customer]);

  const fetchCustomerOrders = async () => {
    if (!customer) return;
    setLoading(true);
    const { data } = await supabase
      .from("orders")
      .select("id, customer_name, status, payment_status, total, created_at, payment_method")
      .eq("user_id", customer.user_id)
      .order("created_at", { ascending: false });
    setOrders(data || []);
    setLoading(false);
  };

  const toggleOrder = async (orderId: string) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
      return;
    }
    setExpandedOrder(orderId);
    if (!orderItems[orderId]) {
      const { data } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId);
      if (data) {
        setOrderItems((prev) => ({ ...prev, [orderId]: data }));
      }
    }
  };

  if (!customer) return null;

  const totalSpent = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Customer Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Customer Info */}
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="font-bold text-primary text-lg">
                {(customer.full_name || customer.email)[0].toUpperCase()}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-base">
                {customer.full_name || "No name provided"}
              </h3>
              <div className="flex items-center gap-1 mt-0.5">
                <Mail className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                <p className="text-sm text-muted-foreground truncate">{customer.email}</p>
              </div>
              {customer.phone && (
                <div className="flex items-center gap-1 mt-0.5">
                  <Phone className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">{customer.phone}</p>
                </div>
              )}
              {customer.address && (
                <div className="flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <p className="text-sm text-muted-foreground truncate">{customer.address}</p>
                </div>
              )}
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-lg font-bold">{orders.length}</p>
              <p className="text-xs text-muted-foreground">Orders</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-lg font-bold">{formatPrice(totalSpent)}</p>
              <p className="text-xs text-muted-foreground">Total Spent</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-lg font-bold">
                {new Date(customer.created_at).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
              </p>
              <p className="text-xs text-muted-foreground">Joined</p>
            </div>
          </div>

          {/* Order History */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              Order History
            </h3>
            {loading ? (
              <p className="text-muted-foreground text-sm text-center py-6">Loading orders...</p>
            ) : orders.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-6">No orders yet.</p>
            ) : (
              <div className="space-y-2">
                {orders.map((order) => (
                  <div key={order.id}>
                    <button
                      onClick={() => toggleOrder(order.id)}
                      className="w-full bg-muted/50 hover:bg-muted/80 rounded-lg p-3 text-left transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium">
                              {new Date(order.created_at).toLocaleDateString()}
                            </p>
                            <Badge variant="secondary" className={`text-xs ${statusColor(order.status)}`}>
                              {order.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {order.payment_method} • {formatPrice(order.total)}
                          </p>
                        </div>
                        <ChevronRight
                          className={`h-4 w-4 text-muted-foreground transition-transform flex-shrink-0 ${
                            expandedOrder === order.id ? "rotate-90" : ""
                          }`}
                        />
                      </div>
                    </button>

                    {expandedOrder === order.id && (
                      <div className="mt-1 ml-3 border-l-2 border-border pl-3 pb-2 space-y-2">
                        {!orderItems[order.id] ? (
                          <p className="text-xs text-muted-foreground py-2">Loading items...</p>
                        ) : orderItems[order.id].length === 0 ? (
                          <p className="text-xs text-muted-foreground py-2">No items found.</p>
                        ) : (
                          orderItems[order.id].map((item) => (
                            <div key={item.id} className="flex gap-2 items-center">
                              {item.product_image && (
                                <img
                                  src={item.product_image}
                                  alt={item.product_name}
                                  className="w-10 h-10 object-cover rounded"
                                />
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate">{item.product_name}</p>
                                <p className="text-xs text-muted-foreground">
                                  Qty: {item.quantity}
                                  {item.size ? ` • ${item.size}` : ""}
                                  {item.color ? ` • ${item.color}` : ""}
                                  {" • "}
                                  {formatPrice(item.price * item.quantity)}
                                </p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerOrdersDialog;
