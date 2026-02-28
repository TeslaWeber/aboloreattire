import { useLocation, useNavigate } from "react-router-dom";
import { Home, Search, ShoppingBag, User } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import SearchDialog from "@/components/search/SearchDialog";

const tabs = [
  { id: "home", icon: Home, label: "Home", path: "/" },
  { id: "search", icon: Search, label: "Search", path: null },
  { id: "cart", icon: ShoppingBag, label: "Cart", path: null },
  { id: "account", icon: User, label: "Account", path: null },
] as const;

const BottomTabNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { totalItems, setIsCartOpen } = useCart();
  const { user } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleTabClick = (tab: (typeof tabs)[number]) => {
    switch (tab.id) {
      case "home":
        navigate("/");
        break;
      case "search":
        setIsSearchOpen(true);
        break;
      case "cart":
        setIsCartOpen(true);
        break;
      case "account":
        navigate(user ? "/account" : "/auth?mode=signin");
        break;
    }
  };

  const isActive = (tab: (typeof tabs)[number]) => {
    if (tab.id === "home") return location.pathname === "/";
    if (tab.id === "account")
      return location.pathname === "/account" || location.pathname === "/auth";
    return false;
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border safe-area-bottom">
        <nav className="flex items-center justify-around h-14">
          {tabs.map((tab) => {
            const active = isActive(tab);
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab)}
                className={`relative flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span className="text-[10px] mt-0.5 font-medium">
                  {tab.label}
                </span>
                {tab.id === "cart" && totalItems > 0 && (
                  <span className="absolute top-1.5 right-1/2 translate-x-3 bg-primary text-primary-foreground text-[9px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Spacer to prevent content from being hidden behind the tab bar */}
      <div className="h-14 safe-area-bottom" />

      <SearchDialog open={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </>
  );
};

export default BottomTabNav;
