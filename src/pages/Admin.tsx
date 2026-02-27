import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/layout/AdminLayout";
import DashboardStats from "@/components/admin/DashboardStats";
import AdminProducts from "@/components/admin/AdminProducts";
import AdminOrders from "@/components/admin/AdminOrders";
import AdminCustomers from "@/components/admin/AdminCustomers";

const Admin = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/auth?type=admin");
    }
  }, [user, isAdmin, loading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchProducts();
      fetchOrders();
      fetchCustomers();
    }
  }, [isAdmin]);

  const fetchProducts = async () => {
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    setProducts(data || []);
  };

  const fetchOrders = async () => {
    const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    setOrders(data || []);
  };

  const fetchCustomers = async () => {
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    setCustomers(data || []);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const pendingOrders = orders.filter((o) => o.status === "pending").length;

  const orderCounts = orders.reduce<Record<string, number>>((acc, o) => {
    const email = o.customer_email;
    acc[email] = (acc[email] || 0) + 1;
    return acc;
  }, {});

  return (
    <AdminLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === "dashboard" && (
        <div>
          <h2 className="font-display text-2xl font-bold mb-6">Dashboard Overview</h2>
          <DashboardStats
            totalProducts={products.length}
            totalOrders={orders.length}
            totalCustomers={customers.length}
            totalRevenue={totalRevenue}
            pendingOrders={pendingOrders}
            recentOrders={orders}
          />
        </div>
      )}
      {activeTab === "products" && (
        <AdminProducts products={products} onRefresh={fetchProducts} />
      )}
      {activeTab === "orders" && (
        <AdminOrders orders={orders} onRefresh={fetchOrders} />
      )}
      {activeTab === "customers" && (
        <AdminCustomers customers={customers} orderCounts={orderCounts} />
      )}
    </AdminLayout>
  );
};

export default Admin;
