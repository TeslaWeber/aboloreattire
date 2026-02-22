import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  CreditCard,
  User,
  ShoppingBag,
  AlertCircle,
  Fingerprint,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { useBiometricAuth } from "@/hooks/useBiometricAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/data/products";

const ORDER_STATUSES = [
  { value: "pending", label: "Pending", color: "bg-yellow-500/20 text-yellow-500", icon: Clock },
  { value: "processing", label: "Processing", color: "bg-blue-500/20 text-blue-500", icon: Package },
  { value: "dispatched", label: "Dispatched", color: "bg-purple-500/20 text-purple-500", icon: Truck },
  { value: "delivered", label: "Delivered", color: "bg-green-500/20 text-green-500", icon: CheckCircle },
  { value: "cancelled", label: "Cancelled", color: "bg-red-500/20 text-red-500", icon: XCircle },
];

const PAYMENT_STATUSES = [
  { value: "pending", label: "Pending", color: "bg-yellow-500/20 text-yellow-500", icon: Clock },
  { value: "confirmed", label: "Confirmed", color: "bg-green-500/20 text-green-500", icon: CheckCircle },
  { value: "unsuccessful", label: "Unsuccessful", color: "bg-red-500/20 text-red-500", icon: XCircle },
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

const Account = () => {
  const { user, session, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isSupported: biometricSupported, isRegistering, register } = useBiometricAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem[]>>({});
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [biometricDevices, setBiometricDevices] = useState<{ id: string; device_name: string | null; created_at: string }[]>([]);
  const [removingDeviceId, setRemovingDeviceId] = useState<string | null>(null);

  const fetchBiometricDevices = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("webauthn_credentials")
      .select("id, device_name, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setBiometricDevices(data || []);
  };

  useEffect(() => {
    if (user) fetchBiometricDevices();
  }, [user]);

  const handleRegisterBiometric = async () => {
    if (!session?.access_token) return;
    const { success, error } = await register(session.access_token);
    if (success) {
      await fetchBiometricDevices();
      toast({ title: "Biometric registered!", description: "You can now sign in with fingerprint or Face ID." });
    } else {
      toast({ title: "Registration failed", description: error, variant: "destructive" });
    }
  };

  const handleRemoveDevice = async (deviceId: string) => {
    setRemovingDeviceId(deviceId);
    const { error } = await supabase
      .from("webauthn_credentials")
      .delete()
      .eq("id", deviceId);
    if (error) {
      toast({ title: "Failed to remove device", description: error.message, variant: "destructive" });
    } else {
      setBiometricDevices((prev) => prev.filter((d) => d.id !== deviceId));
      toast({ title: "Device removed", description: "Biometric credential has been removed." });
    }
    setRemovingDeviceId(null);
  };

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth?mode=signin");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    setLoadingOrders(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", user?.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching orders:", error);
    } else {
      setOrders(data || []);
    }
    setLoadingOrders(false);
  };

  const fetchOrderItems = async (orderId: string) => {
    if (orderItems[orderId]) return;

    const { data, error } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderId);

    if (!error && data) {
      setOrderItems((prev) => ({ ...prev, [orderId]: data }));
    }
  };

  const toggleOrderExpand = (orderId: string) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
    } else {
      setExpandedOrder(orderId);
      fetchOrderItems(orderId);
    }
  };

  const getStatusInfo = (status: string) => {
    return ORDER_STATUSES.find((s) => s.value === status) || ORDER_STATUSES[0];
  };

  const getPaymentStatusInfo = (status: string) => {
    return PAYMENT_STATUSES.find((s) => s.value === status) || PAYMENT_STATUSES[0];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="font-display text-2xl sm:text-3xl font-bold mb-2">My Account</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Welcome back, {user.email}
            </p>
          </div>

          <Tabs defaultValue="orders" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="orders" className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" />
                <span className="hidden sm:inline">Order History</span>
                <span className="sm:hidden">Orders</span>
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Profile
              </TabsTrigger>
            </TabsList>

            {/* Orders Tab */}
            <TabsContent value="orders" className="space-y-4">
              {loadingOrders ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : orders.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-semibold text-lg mb-2">No orders yet</h3>
                    <p className="text-muted-foreground text-center mb-4">
                      Start shopping to see your orders here
                    </p>
                    <Button asChild>
                      <Link to="/products">Browse Products</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => {
                    const statusInfo = getStatusInfo(order.status);
                    const paymentInfo = getPaymentStatusInfo(order.payment_status);
                    const StatusIcon = statusInfo.icon;
                    const PaymentIcon = paymentInfo.icon;
                    const isExpanded = expandedOrder === order.id;
                    const items = orderItems[order.id] || [];

                    return (
                      <Card key={order.id} className="overflow-hidden">
                        <CardHeader className="pb-3">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                            <div className="space-y-1">
                              <CardTitle className="text-base sm:text-lg font-semibold">
                                Order #{order.id.slice(0, 8).toUpperCase()}
                              </CardTitle>
                              <p className="text-xs sm:text-sm text-muted-foreground">
                                {new Date(order.created_at).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {/* Order Status */}
                              <Badge
                                variant="secondary"
                                className={`${statusInfo.color} flex items-center gap-1 text-xs`}
                              >
                                <StatusIcon className="h-3 w-3" />
                                {statusInfo.label}
                              </Badge>
                              {/* Payment Status */}
                              <Badge
                                variant="secondary"
                                className={`${paymentInfo.color} flex items-center gap-1 text-xs`}
                              >
                                <PaymentIcon className="h-3 w-3" />
                                Payment: {paymentInfo.label}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          {/* Summary */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 border-t border-border">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <CreditCard className="h-4 w-4" />
                              {order.payment_method}
                            </div>
                            <div className="flex items-center justify-between sm:justify-end gap-4">
                              <span className="font-bold text-primary text-lg">
                                {formatPrice(order.total)}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleOrderExpand(order.id)}
                              >
                                {isExpanded ? "Hide Details" : "View Details"}
                              </Button>
                            </div>
                          </div>

                          {/* Expanded Details */}
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="pt-4 border-t border-border space-y-4"
                            >
                              {/* Order Progress */}
                              <div>
                                <h4 className="font-semibold text-sm mb-3">Order Status</h4>
                                <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-2">
                                  {ORDER_STATUSES.slice(0, 4).map((status, index) => {
                                    const currentIndex = ORDER_STATUSES.findIndex(
                                      (s) => s.value === order.status
                                    );
                                    const isCompleted = index <= currentIndex;
                                    const Icon = status.icon;
                                    return (
                                      <div
                                        key={status.value}
                                        className="flex items-center flex-shrink-0"
                                      >
                                        <div
                                          className={`flex flex-col items-center ${
                                            isCompleted ? "text-primary" : "text-muted-foreground"
                                          }`}
                                        >
                                          <div
                                            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${
                                              isCompleted
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-muted"
                                            }`}
                                          >
                                            <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                                          </div>
                                          <span className="text-[10px] sm:text-xs mt-1 text-center">
                                            {status.label}
                                          </span>
                                        </div>
                                        {index < 3 && (
                                          <div
                                            className={`w-6 sm:w-12 h-0.5 mx-1 ${
                                              index < currentIndex ? "bg-primary" : "bg-muted"
                                            }`}
                                          />
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Payment Status Alert */}
                              {order.payment_status === "pending" && (
                                <div className="flex items-start gap-3 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                                  <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                                  <div>
                                    <p className="text-sm font-medium text-yellow-500">
                                      Payment Pending
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Your payment is being verified. Once confirmed, your order will be processed.
                                    </p>
                                  </div>
                                </div>
                              )}
                              {order.payment_status === "unsuccessful" && (
                                <div className="flex items-start gap-3 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                                  <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                                  <div>
                                    <p className="text-sm font-medium text-red-500">
                                      Payment Unsuccessful
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      We couldn't verify your payment. Please contact support or try placing a new order.
                                    </p>
                                  </div>
                                </div>
                              )}

                              {/* Order Items */}
                              <div>
                                <h4 className="font-semibold text-sm mb-3">Items</h4>
                                {items.length === 0 ? (
                                  <p className="text-sm text-muted-foreground">Loading items...</p>
                                ) : (
                                  <div className="space-y-2">
                                    {items.map((item) => (
                                      <div
                                        key={item.id}
                                        className="flex gap-3 p-2 bg-muted/50 rounded-lg"
                                      >
                                        {item.product_image && (
                                          <img
                                            src={item.product_image}
                                            alt={item.product_name}
                                            className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded"
                                          />
                                        )}
                                        <div className="flex-1 min-w-0">
                                          <p className="font-medium text-sm truncate">
                                            {item.product_name}
                                          </p>
                                          <div className="flex flex-wrap gap-1 mt-1">
                                            {item.size && (
                                              <Badge variant="outline" className="text-xs">
                                                Size: {item.size}
                                              </Badge>
                                            )}
                                            {item.color && (
                                              <Badge variant="outline" className="text-xs">
                                                {item.color}
                                              </Badge>
                                            )}
                                            <Badge variant="outline" className="text-xs">
                                              Qty: {item.quantity}
                                            </Badge>
                                          </div>
                                        </div>
                                        <span className="font-semibold text-primary text-sm">
                                          {formatPrice(item.price * item.quantity)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Delivery Info */}
                              <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-semibold text-sm mb-2">Delivery Address</h4>
                                  <div className="text-sm text-muted-foreground space-y-1">
                                    <p>{order.customer_name}</p>
                                    <p>{order.delivery_address}</p>
                                    <p>
                                      {order.delivery_city}, {order.delivery_state}
                                    </p>
                                    <p>{order.customer_phone}</p>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-semibold text-sm mb-2">Order Summary</h4>
                                  <div className="text-sm space-y-1">
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Subtotal</span>
                                      <span>{formatPrice(order.subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Delivery</span>
                                      <span>
                                        {order.delivery_fee === 0
                                          ? "Free"
                                          : formatPrice(order.delivery_fee)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between font-bold pt-1 border-t border-border">
                                      <span>Total</span>
                                      <span className="text-primary">
                                        {formatPrice(order.total)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Profile Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p className="mt-1">{user.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Member Since
                    </label>
                    <p className="mt-1">
                      {new Date(user.created_at || "").toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Total Orders
                    </label>
                    <p className="mt-1">{orders.length}</p>
                  </div>

                  {/* Biometric Registration & Management */}
                  {biometricSupported && (
                    <div className="pt-4 border-t border-border space-y-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Biometric Sign-In
                        </label>
                        <p className="text-xs text-muted-foreground mt-1 mb-3">
                          {biometricDevices.length > 0
                            ? `${biometricDevices.length} device${biometricDevices.length > 1 ? "s" : ""} registered.`
                            : "Set up fingerprint or Face ID for faster sign-in."}
                        </p>
                        <Button
                          variant={biometricDevices.length > 0 ? "outline" : "default"}
                          onClick={handleRegisterBiometric}
                          disabled={isRegistering}
                          className="flex items-center gap-2"
                        >
                          <Fingerprint className="h-4 w-4" />
                          {isRegistering
                            ? "Setting up..."
                            : biometricDevices.length > 0
                            ? "Add Another Device"
                            : "Set Up Biometric Sign-In"}
                        </Button>
                      </div>

                      {biometricDevices.length > 0 && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">
                            Registered Devices
                          </label>
                          {biometricDevices.map((device) => (
                            <div
                              key={device.id}
                              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <Fingerprint className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-sm font-medium">
                                    {device.device_name || "Biometric Device"}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Added {new Date(device.created_at).toLocaleDateString("en-US", {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveDevice(device.id)}
                                disabled={removingDeviceId === device.id}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                {removingDeviceId === device.id ? "Removing..." : "Remove"}
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default Account;
