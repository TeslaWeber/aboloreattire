import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  LogOut,
  Menu,
  X,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "products", label: "Products", icon: Package },
  { id: "orders", label: "Orders", icon: ShoppingCart },
  { id: "customers", label: "Customers", icon: Users },
];

const AdminLayout = ({ children, activeTab, onTabChange }: AdminLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [newOrderCount, setNewOrderCount] = useState(0);
  const { signOut } = useAuth();
  const navigate = useNavigate();

  // Track new orders for notification dot
  useEffect(() => {
    const lastCheck = localStorage.getItem('admin-last-order-check');
    const fetchNewOrders = async () => {
      if (!lastCheck) {
        localStorage.setItem('admin-last-order-check', new Date().toISOString());
        return;
      }
      const { count } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .gt('created_at', lastCheck);
      setNewOrderCount(count || 0);
    };
    fetchNewOrders();

    const channel = supabase
      .channel('admin-layout-orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, () => {
        setNewOrderCount((prev) => prev + 1);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const handleTabChange = (tabId: string) => {
    onTabChange(tabId);
    setSidebarOpen(false);
    if (tabId === "orders") {
      setNewOrderCount(0);
      localStorage.setItem('admin-last-order-check', new Date().toISOString());
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-card border-r border-border z-50 transform transition-transform lg:translate-x-0 flex flex-col ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <h1 className="font-display text-lg font-bold luxury-text-gradient">ABOLORE COUTURE</h1>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden"><X className="h-5 w-5" /></button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Admin Dashboard</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors relative ${
                activeTab === item.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
              {item.id === "orders" && newOrderCount > 0 && (
                <span className="absolute right-3 h-2.5 w-2.5 bg-destructive rounded-full" />
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-border space-y-2">
          <Link to="/" className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <Store className="h-5 w-5" />
            Back to Store
          </Link>
          <Button variant="outline" className="w-full" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <header className="lg:hidden sticky top-0 h-14 bg-card border-b border-border z-40 flex items-center justify-between px-4">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="font-display text-lg font-bold luxury-text-gradient">Admin</h1>
          <button onClick={handleLogout}>
            <LogOut className="h-5 w-5 text-muted-foreground" />
          </button>
        </header>

        <main className="flex-1 p-4 lg:p-8 pt-4">{children}</main>
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  );
};

export default AdminLayout;
