import { Link, useNavigate } from "react-router-dom";
import { Search, User, ShoppingBag, Menu, Truck, Shield, RefreshCw, Heart } from "lucide-react";

import { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [signOutDialogOpen, setSignOutDialogOpen] = useState(false);
  const [isCondensed, setIsCondensed] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsCondensed(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const { totalItems, setIsCartOpen } = useCart();
  const { totalItems: wishlistTotal } = useWishlist();
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
        <div className="animate-marquee whitespace-nowrap py-1.5 text-[11px] tracking-widest uppercase font-light inline-flex">
          <span className="mx-8">Welcome to ABOLORE COUTURE — Thank you for choosing us — Enjoy your shopping</span>
          <span className="mx-8">Welcome to ABOLORE COUTURE — Thank you for choosing us — Enjoy your shopping</span>
          <span className="mx-8">Welcome to ABOLORE COUTURE — Thank you for choosing us — Enjoy your shopping</span>
          <span className="mx-8">Welcome to ABOLORE COUTURE — Thank you for choosing us — Enjoy your shopping</span>
        </div>
      </div>

      {/* Main Header */}
      <div className="bg-background/98 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4 lg:px-8">
          {/* Desktop: Three-row premium layout */}
          <div className="hidden lg:block">
            {/* Top row - minimal nav links */}
            <div className={`flex items-center justify-between text-[11px] tracking-widest uppercase transition-all duration-500 ease-in-out ${isCondensed ? 'py-1' : 'py-2'}`}>
              <nav className="flex items-center gap-8">
                <Link to="/products" className="text-muted-foreground hover:text-primary transition-colors duration-300">
                  Shop All
                </Link>
                {isAdmin && (
                  <Link to="/admin" className="relative text-muted-foreground hover:text-primary transition-colors duration-300">
                    Dashboard
                    {hasAdminNotification && (
                      <span className="absolute -top-0.5 -right-2.5 h-1.5 w-1.5 bg-destructive rounded-full" />
                    )}
                  </Link>
                )}
              </nav>
              <div className="flex items-center gap-6">
                {user ? (
                  <Link
                    to="/account"
                    className="relative text-muted-foreground hover:text-primary transition-colors duration-300"
                    onClick={() => { setHasNotification(false); localStorage.setItem('last-order-check', new Date().toISOString()); }}
                  >
                    Account
                    {hasNotification && (
                      <span className="absolute -top-0.5 -right-2.5 h-1.5 w-1.5 bg-destructive rounded-full" />
                    )}
                  </Link>
                ) : (
                  <>
                    <Link to="/auth?mode=signin" className="text-muted-foreground hover:text-primary transition-colors duration-300">Sign In</Link>
                    <Link to="/auth?mode=signup" className="text-muted-foreground hover:text-primary transition-colors duration-300">Register</Link>
                  </>
                )}
              </div>
            </div>

            {/* Thin divider */}
            <div className="h-px bg-border/40" />

            {/* Center row - brand name */}
            <div className={`flex items-center justify-center transition-all duration-500 ease-in-out ${isCondensed ? 'py-1.5' : 'py-4'}`}>
              <Link to="/" className="group">
                <h1 className={`font-display font-light tracking-[0.3em] uppercase luxury-text-gradient transition-all duration-500 ease-in-out group-hover:opacity-80 ${isCondensed ? 'text-lg lg:text-xl' : 'text-2xl lg:text-[1.7rem]'}`}>
                  ABOLORE COUTURE
                </h1>
              </Link>
            </div>

            {/* Thin divider */}
            <div className="h-px bg-border/40" />

            {/* Bottom row - icon actions */}
            <div className={`flex items-center justify-center gap-10 transition-all duration-500 ease-in-out ${isCondensed ? 'py-1.5' : 'py-3'}`}>
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 text-foreground/60 hover:text-primary transition-colors duration-300"
                aria-label="Search"
              >
                <Search className="h-[18px] w-[18px] stroke-[1.5]" />
              </button>

              <Link to="/wishlist" className="relative p-2 text-foreground/60 hover:text-primary transition-colors duration-300" aria-label="Wishlist">
                <Heart className="h-[18px] w-[18px] stroke-[1.5]" />
                {wishlistTotal > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[9px] font-semibold rounded-full h-4 w-4 flex items-center justify-center">
                    {wishlistTotal}
                  </span>
                )}
              </Link>

              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 text-foreground/60 hover:text-primary transition-colors duration-300"
                aria-label="Cart"
              >
                <ShoppingBag className="h-[18px] w-[18px] stroke-[1.5]" />
                {totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[9px] font-semibold rounded-full h-4 w-4 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="flex lg:hidden items-center justify-between h-14 gap-2">
            <button
              className="relative p-2 text-foreground/70 hover:text-primary transition-colors duration-300 shrink-0"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Menu"
            >
              <Menu className="h-5 w-5 stroke-[1.5]" />
              {(hasAdminNotification && isAdmin) && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-destructive rounded-full" />
              )}
            </button>

            <Link to="/" className="min-w-0 flex-1 flex justify-center">
              <h1 className="font-display text-[14px] font-light tracking-[0.2em] uppercase luxury-text-gradient whitespace-nowrap">
                ABOLORE COUTURE
              </h1>
            </Link>

            <div className="flex items-center shrink-0">
              {user ? (
                <Link
                  to="/account"
                  className="relative p-1.5 text-foreground/70 hover:text-primary transition-colors duration-300"
                  onClick={() => { setHasNotification(false); localStorage.setItem('last-order-check', new Date().toISOString()); }}
                  aria-label="Account"
                >
                  <User className="h-[17px] w-[17px] stroke-[1.5]" />
                  {hasNotification && (
                    <span className="absolute top-0.5 right-0.5 h-1.5 w-1.5 bg-destructive rounded-full" />
                  )}
                </Link>
              ) : (
                <Link to="/auth?mode=signin" className="p-1.5 text-foreground/70 hover:text-primary transition-colors duration-300" aria-label="Sign In">
                  <User className="h-[17px] w-[17px] stroke-[1.5]" />
                </Link>
              )}
              <Link to="/wishlist" className="relative p-1.5 text-foreground/70 hover:text-primary transition-colors duration-300" aria-label="Wishlist">
                <Heart className="h-[17px] w-[17px] stroke-[1.5]" />
                {wishlistTotal > 0 && (
                  <span className="absolute top-0 right-0 bg-primary text-primary-foreground text-[8px] font-semibold rounded-full h-3.5 w-3.5 flex items-center justify-center">
                    {wishlistTotal}
                  </span>
                )}
              </Link>
              <button onClick={() => setIsSearchOpen(true)} className="p-1.5 text-foreground/70 hover:text-primary transition-colors duration-300" aria-label="Search">
                <Search className="h-[17px] w-[17px] stroke-[1.5]" />
              </button>
              <button onClick={() => setIsCartOpen(true)} className="relative p-1.5 text-foreground/70 hover:text-primary transition-colors duration-300" aria-label="Cart">
                <ShoppingBag className="h-[17px] w-[17px] stroke-[1.5]" />
                {totalItems > 0 && (
                  <span className="absolute top-0 right-0 bg-primary text-primary-foreground text-[8px] font-semibold rounded-full h-3.5 w-3.5 flex items-center justify-center">
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
        <SheetContent side="left" className="w-72 p-0 border-r border-border/30">
          <SheetHeader className="px-6 pt-8 pb-6 border-b border-border/30">
            <SheetTitle className="text-left font-display text-base font-light tracking-[0.3em] uppercase luxury-text-gradient">ABOLORE COUTURE</SheetTitle>
          </SheetHeader>
          <nav className="p-5 space-y-0.5">
            {user ? (
              <>
                <Link
                  to="/account"
                  className="block py-3 px-4 text-sm tracking-wide text-foreground/70 hover:text-primary hover:bg-muted/50 rounded-md transition-all duration-300"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  My Account
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="relative block py-3 px-4 text-sm tracking-wide text-foreground/70 hover:text-primary hover:bg-muted/50 rounded-md transition-all duration-300"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setHasAdminNotification(false);
                      localStorage.setItem('admin-last-order-check', new Date().toISOString());
                    }}
                  >
                    Admin Dashboard
                    {hasAdminNotification && (
                      <span className="absolute top-3.5 right-4 h-2 w-2 bg-destructive rounded-full" />
                    )}
                  </Link>
                )}
                <Link
                  to="/wishlist"
                  className="block py-3 px-4 text-sm tracking-wide text-foreground/70 hover:text-primary hover:bg-muted/50 rounded-md transition-all duration-300"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Wishlist
                </Link>
                <button
                  onClick={() => { setIsMobileMenuOpen(false); setSignOutDialogOpen(true); }}
                  className="block w-full text-left py-3 px-4 text-sm tracking-wide text-foreground/70 hover:text-primary hover:bg-muted/50 rounded-md transition-all duration-300"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/auth?mode=signin" className="block py-3 px-4 text-sm tracking-wide text-foreground/70 hover:text-primary hover:bg-muted/50 rounded-md transition-all duration-300" onClick={() => setIsMobileMenuOpen(false)}>
                  Sign In
                </Link>
                <Link to="/auth?mode=signup" className="block py-3 px-4 text-sm tracking-wide text-foreground/70 hover:text-primary hover:bg-muted/50 rounded-md transition-all duration-300" onClick={() => setIsMobileMenuOpen(false)}>
                  Create Account
                </Link>
              </>
            )}

            {/* Features */}
            <div className="pt-6 mt-6 border-t border-border/30 space-y-1">
              <div className="flex items-center gap-3 py-2.5 px-4 text-foreground/50 text-xs tracking-wider uppercase">
                <Truck className="h-4 w-4 text-primary/70" />
                Swift & Safe Delivery
              </div>
              <div className="flex items-center gap-3 py-2.5 px-4 text-foreground/50 text-xs tracking-wider uppercase">
                <Shield className="h-4 w-4 text-primary/70" />
                Secure Payment
              </div>
              <div className="flex items-center gap-3 py-2.5 px-4 text-foreground/50 text-xs tracking-wider uppercase">
                <RefreshCw className="h-4 w-4 text-primary/70" />
                Easy Returns
              </div>
            </div>
          </nav>
        </SheetContent>
      </Sheet>

      {/* Search Dialog */}
      <SearchDialog open={isSearchOpen} onOpenChange={setIsSearchOpen} />

      {/* Sign Out Confirmation */}
      <AlertDialog open={signOutDialogOpen} onOpenChange={setSignOutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to sign out?</AlertDialogTitle>
            <AlertDialogDescription>
              You will need to sign in again to access your account and place orders.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSignOut}>Sign Out</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
};

export default Header;
