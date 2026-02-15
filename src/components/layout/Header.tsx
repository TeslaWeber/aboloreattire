import { Link, useNavigate } from "react-router-dom";
import { Search, User, ShoppingBag, Menu, Smartphone } from "lucide-react";
import { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import SearchDialog from "@/components/search/SearchDialog";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { totalItems, setIsCartOpen } = useCart();
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [hasNotification, setHasNotification] = useState(false);
  const [hasAdminNotification, setHasAdminNotification] = useState(false);

  // User order notification
  useEffect(() => {
    if (!user) return;
    const checkOrders = async () => {
      const lastChecked = localStorage.getItem('last-order-check');
      const { data } = await supabase
        .from('orders')
        .select('id, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1);
      if (data && data.length > 0) {
        if (lastChecked && new Date(data[0].updated_at) > new Date(lastChecked)) {
          setHasNotification(true);
        }
      }
    };
    checkOrders();
    const channel = supabase
      .channel('order-updates')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` }, () => {
        setHasNotification(true);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Admin new order notification
  useEffect(() => {
    if (!isAdmin) return;
    const lastAdminCheck = localStorage.getItem('admin-last-order-check');
    const checkNewOrders = async () => {
      const { data } = await supabase
        .from('orders')
        .select('id, created_at')
        .order('created_at', { ascending: false })
        .limit(1);
      if (data && data.length > 0 && lastAdminCheck) {
        if (new Date(data[0].created_at) > new Date(lastAdminCheck)) {
          setHasAdminNotification(true);
        }
      }
    };
    checkNewOrders();
    const channel = supabase
      .channel('admin-new-orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, () => {
        setHasAdminNotification(true);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isAdmin]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* News Flash Ticker */}
      <div className="bg-primary text-primary-foreground overflow-hidden">
        <div className="animate-marquee whitespace-nowrap py-1.5 text-xs font-medium inline-flex">
          <span className="mx-8">Welcome to Abolore Couture. Thank you for choosing us. Enjoy your shopping.</span>
          <span className="mx-8">Welcome to Abolore Couture. Thank you for choosing us. Enjoy your shopping.</span>
          <span className="mx-8">Welcome to Abolore Couture. Thank you for choosing us. Enjoy your shopping.</span>
          <span className="mx-8">Welcome to Abolore Couture. Thank you for choosing us. Enjoy your shopping.</span>
        </div>
      </div>

      {/* Main Header */}
      <div className="bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Mobile Menu Button */}
            <button
              className="lg:hidden relative p-2 hover:bg-muted rounded-md transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="h-6 w-6" />
              {(hasAdminNotification && isAdmin) && (
                <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-destructive rounded-full border-2 border-background" />
              )}
            </button>

            {/* Logo */}
            <Link to="/" className="flex items-center">
              <h1 className="font-display text-2xl lg:text-3xl font-bold luxury-text-gradient">
                ABOLORE COUTURE
              </h1>
            </Link>

            {/* Desktop Navigation - minimal */}
            <nav className="hidden lg:flex items-center space-x-8">
              <Link to="/products" className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors">
                All Products
              </Link>
              {isAdmin && (
                <Link to="/admin" className="relative text-sm font-medium text-foreground/80 hover:text-primary transition-colors">
                  Admin Dashboard
                  {hasAdminNotification && (
                    <span className="absolute -top-1 -right-3 h-2.5 w-2.5 bg-destructive rounded-full" />
                  )}
                </Link>
              )}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2 lg:gap-4">
              <button onClick={() => setIsSearchOpen(true)} className="p-2 hover:bg-muted rounded-full transition-colors">
                <Search className="h-5 w-5" />
              </button>

              {user ? (
                <Link
                  to="/account"
                  className="relative p-2 hover:bg-muted rounded-full transition-colors"
                  onClick={() => { setHasNotification(false); localStorage.setItem('last-order-check', new Date().toISOString()); }}
                >
                  <User className="h-5 w-5" />
                  {hasNotification && (
                    <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-destructive rounded-full border-2 border-background" />
                  )}
                </Link>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-2 hover:bg-muted rounded-full transition-colors">
                      <User className="h-5 w-5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild><Link to="/auth?mode=signin">Sign In</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link to="/auth?mode=signup">Create Account</Link></DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              <button onClick={() => setIsCartOpen(true)} className="relative p-2 hover:bg-muted rounded-full transition-colors">
                <ShoppingBag className="h-5 w-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Side Menu (Sheet) */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="p-6 border-b border-border">
            <SheetTitle className="font-display text-lg luxury-text-gradient text-left">ABOLORE COUTURE</SheetTitle>
          </SheetHeader>
          <nav className="p-4 space-y-1">
            {user ? (
              <>
                <Link
                  to="/account"
                  className="block py-3 px-3 text-foreground/80 hover:text-primary hover:bg-muted rounded-lg transition-colors font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  My Account
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="relative block py-3 px-3 text-foreground/80 hover:text-primary hover:bg-muted rounded-lg transition-colors font-medium"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setHasAdminNotification(false);
                      localStorage.setItem('admin-last-order-check', new Date().toISOString());
                    }}
                  >
                    Admin Dashboard
                    {hasAdminNotification && (
                      <span className="absolute top-3 right-3 h-2.5 w-2.5 bg-destructive rounded-full" />
                    )}
                  </Link>
                )}
                <button
                  onClick={() => { handleSignOut(); setIsMobileMenuOpen(false); }}
                  className="block w-full text-left py-3 px-3 text-foreground/80 hover:text-primary hover:bg-muted rounded-lg transition-colors font-medium"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/auth?mode=signin" className="block py-3 px-3 text-foreground/80 hover:text-primary hover:bg-muted rounded-lg transition-colors font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                  Sign In
                </Link>
                <Link to="/auth?mode=signup" className="block py-3 px-3 text-foreground/80 hover:text-primary hover:bg-muted rounded-lg transition-colors font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                  Create Account
                </Link>
              </>
            )}

            {/* Get the App */}
            <div className="pt-4 mt-4 border-t border-border space-y-1">
              <a
                href="https://median.co/share/yewkqae#apk"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 py-3 px-3 text-primary font-medium hover:bg-muted rounded-lg transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Smartphone className="h-5 w-5" />
                Get the App (Android)
              </a>
              <a
                href="#"
                className="flex items-center gap-3 py-3 px-3 text-primary/50 font-medium cursor-not-allowed"
                onClick={(e) => e.preventDefault()}
              >
                <Smartphone className="h-5 w-5" />
                Get the App (iOS) — Coming Soon
              </a>
            </div>
          </nav>
        </SheetContent>
      </Sheet>

      {/* Search Dialog */}
      <SearchDialog open={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </header>
  );
};

export default Header;
