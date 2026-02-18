import { Package, ShoppingCart, Users, DollarSign, TrendingUp, Clock } from "lucide-react";
import { formatPrice } from "@/data/products";

interface DashboardStatsProps {
  totalProducts: number;
  totalOrders: number;
  totalCustomers: number;
  totalRevenue: number;
  pendingOrders: number;
  recentOrders: any[];
}

const DashboardStats = ({
  totalProducts,
  totalOrders,
  totalCustomers,
  totalRevenue,
  pendingOrders,
  recentOrders,
}: DashboardStatsProps) => {
  const stats = [
    {
      label: "Total Revenue",
      value: formatPrice(totalRevenue),
      icon: DollarSign,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      label: "Total Orders",
      value: totalOrders.toString(),
      icon: ShoppingCart,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Products",
      value: totalProducts.toString(),
      icon: Package,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      label: "Customers",
      value: totalCustomers.toString(),
      icon: Users,
      color: "text-primary",
      bg: "bg-primary/10",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-card border border-border rounded-xl p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Pending Orders */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-yellow-500" />
          <h3 className="font-display text-lg font-semibold">Pending Orders</h3>
          <span className="ml-auto text-sm text-muted-foreground">{pendingOrders} pending</span>
        </div>
        {recentOrders.filter(o => o.status === "pending").length === 0 ? (
          <p className="text-muted-foreground text-sm py-4">No pending orders</p>
        ) : (
          <div className="space-y-3">
            {recentOrders
              .filter(o => o.status === "pending")
              .slice(0, 5)
              .map((order) => (
                <div key={order.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium">{order.customer_name}</p>
                    <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                  <p className="text-sm font-bold text-primary">{formatPrice(order.total)}</p>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardStats;
