import { useState } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, Eye, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatPrice } from "@/data/products";
import OrderDetailsDialog from "./OrderDetailsDialog";

const ORDER_STATUSES = [
  { value: "pending", label: "Pending", color: "bg-yellow-500/20 text-yellow-500" },
  { value: "processing", label: "Processing", color: "bg-blue-500/20 text-blue-500" },
  { value: "dispatched", label: "Dispatched", color: "bg-purple-500/20 text-purple-500" },
  { value: "delivered", label: "Delivered", color: "bg-green-500/20 text-green-500" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-500/20 text-red-500" },
];

const PAYMENT_STATUSES = [
  { value: "pending", label: "Pending", color: "bg-yellow-500/20 text-yellow-500" },
  { value: "confirmed", label: "Confirmed", color: "bg-green-500/20 text-green-500" },
  { value: "unsuccessful", label: "Unsuccessful", color: "bg-red-500/20 text-red-500" },
];

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
  receipt_url: string | null;
}

interface AdminOrdersProps {
  orders: Order[];
  onRefresh: () => void;
}

const AdminOrders = ({ orders, onRefresh }: AdminOrdersProps) => {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_email.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_phone.includes(search);
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) =>
    ORDER_STATUSES.find((s) => s.value === status)?.color || "bg-muted text-muted-foreground";

  const getPaymentStatusColor = (status: string) =>
    PAYMENT_STATUSES.find((s) => s.value === status)?.color || "bg-muted text-muted-foreground";

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
    if (error) {
      toast({ title: "Error", description: "Failed to update order status.", variant: "destructive" });
    } else {
      toast({ title: "Status Updated", description: `Order marked as ${newStatus}.` });
      onRefresh();
    }
  };

  const handleUpdatePaymentStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase.from("orders").update({ payment_status: newStatus }).eq("id", orderId);
    if (error) {
      toast({ title: "Error", description: "Failed to update payment status.", variant: "destructive" });
    } else {
      toast({ title: "Payment Status Updated", description: `Payment marked as ${newStatus}.` });
      onRefresh();
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold">Orders</h2>
        <p className="text-sm text-muted-foreground">{orders.length} total orders</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {ORDER_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>{search || statusFilter !== "all" ? "No orders match your filters." : "No orders yet."}</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredOrders.map((order) => (
            <div key={order.id} className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="font-semibold">{order.customer_name}</h3>
                  <p className="text-sm text-muted-foreground">{order.customer_email}</p>
                  <p className="text-sm text-muted-foreground">{order.customer_phone}</p>
                  <p className="text-xs text-muted-foreground">
                    {order.delivery_address}, {order.delivery_city}, {order.delivery_state}
                  </p>
                </div>
                <div className="text-right space-y-2 flex-shrink-0">
                  <p className="font-bold text-lg text-primary">{formatPrice(order.total)}</p>
                  {/* Order Status */}
                  <div className="flex items-center gap-2 justify-end">
                    <span className="text-xs text-muted-foreground">Order:</span>
                    <Select value={order.status} onValueChange={(v) => handleUpdateOrderStatus(order.id, v)}>
                      <SelectTrigger className={`h-7 w-28 text-xs ${getStatusColor(order.status)}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ORDER_STATUSES.map((s) => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Payment Status */}
                  <div className="flex items-center gap-2 justify-end">
                    <span className="text-xs text-muted-foreground">Payment:</span>
                    <Select value={order.payment_status || "pending"} onValueChange={(v) => handleUpdatePaymentStatus(order.id, v)}>
                      <SelectTrigger className={`h-7 w-28 text-xs ${getPaymentStatusColor(order.payment_status || "pending")}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_STATUSES.map((s) => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <Badge variant="outline" className="text-xs capitalize">{order.payment_method}</Badge>
                </div>
                <Button size="sm" variant="outline" onClick={() => { setSelectedOrder(order); setOrderDialogOpen(true); }}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <OrderDetailsDialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen} order={selectedOrder} />
    </motion.div>
  );
};

export default AdminOrders;
