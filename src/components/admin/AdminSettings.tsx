import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Settings, CreditCard, Upload, Palette } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const themeOptions = [
  {
    id: "gold",
    name: "Gold",
    preview: "bg-[hsl(38,70%,50%)]",
    colors: {
      primary: "38 70% 50%",
      accent: "38 70% 50%",
      ring: "38 70% 50%",
      goldLight: "38 80% 65%",
      goldDark: "38 60% 35%",
      roseGold: "15 50% 55%",
    },
  },
  {
    id: "purple",
    name: "Purple",
    preview: "bg-[hsl(270,60%,55%)]",
    colors: {
      primary: "270 60% 55%",
      accent: "270 60% 55%",
      ring: "270 60% 55%",
      goldLight: "270 70% 70%",
      goldDark: "270 50% 40%",
      roseGold: "290 50% 55%",
    },
  },
  {
    id: "blue",
    name: "Blue",
    preview: "bg-[hsl(215,70%,50%)]",
    colors: {
      primary: "215 70% 50%",
      accent: "215 70% 50%",
      ring: "215 70% 50%",
      goldLight: "215 80% 65%",
      goldDark: "215 60% 35%",
      roseGold: "200 50% 55%",
    },
  },
  {
    id: "emerald",
    name: "Emerald",
    preview: "bg-[hsl(160,60%,45%)]",
    colors: {
      primary: "160 60% 45%",
      accent: "160 60% 45%",
      ring: "160 60% 45%",
      goldLight: "160 70% 60%",
      goldDark: "160 50% 30%",
      roseGold: "140 50% 50%",
    },
  },
  {
    id: "rose",
    name: "Rose",
    preview: "bg-[hsl(340,65%,55%)]",
    colors: {
      primary: "340 65% 55%",
      accent: "340 65% 55%",
      ring: "340 65% 55%",
      goldLight: "340 75% 70%",
      goldDark: "340 55% 40%",
      roseGold: "350 50% 55%",
    },
  },
  {
    id: "amber",
    name: "Amber",
    preview: "bg-[hsl(25,85%,55%)]",
    colors: {
      primary: "25 85% 55%",
      accent: "25 85% 55%",
      ring: "25 85% 55%",
      goldLight: "25 90% 65%",
      goldDark: "25 70% 40%",
      roseGold: "15 60% 55%",
    },
  },
];

const applyTheme = (themeId: string) => {
  const theme = themeOptions.find((t) => t.id === themeId);
  if (!theme) return;
  const root = document.documentElement;
  root.style.setProperty("--primary", theme.colors.primary);
  root.style.setProperty("--accent", theme.colors.accent);
  root.style.setProperty("--ring", theme.colors.ring);
  root.style.setProperty("--gold-light", theme.colors.goldLight);
  root.style.setProperty("--gold-dark", theme.colors.goldDark);
  root.style.setProperty("--rose-gold", theme.colors.roseGold);
  root.style.setProperty("--sidebar-primary", theme.colors.primary);
  root.style.setProperty("--sidebar-ring", theme.colors.ring);
};

const AdminSettings = () => {
  const { toast } = useToast();
  const [paymentMode, setPaymentMode] = useState<string>("paystack");
  const [selectedTheme, setSelectedTheme] = useState<string>("gold");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data: paymentData } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "payment_mode")
      .maybeSingle();
    if (paymentData) setPaymentMode(paymentData.value);

    const { data: themeData } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "site_theme")
      .maybeSingle();
    if (themeData) {
      setSelectedTheme(themeData.value);
      applyTheme(themeData.value);
    }
    setLoading(false);
  };

  const togglePaymentMode = async () => {
    const newMode = paymentMode === "paystack" ? "receipt_upload" : "paystack";
    const { error } = await supabase
      .from("site_settings")
      .update({ value: newMode, updated_at: new Date().toISOString() })
      .eq("key", "payment_mode");

    if (error) {
      toast({ title: "Error", description: "Failed to update payment mode.", variant: "destructive" });
    } else {
      setPaymentMode(newMode);
      toast({
        title: "Payment Mode Updated",
        description: newMode === "paystack"
          ? "Customers will pay via Paystack (card, bank transfer, USSD)."
          : "Customers will upload payment receipt screenshots.",
      });
    }
  };

  const handleThemeChange = async (themeId: string) => {
    applyTheme(themeId);
    setSelectedTheme(themeId);

    // Upsert theme setting
    const { data: existing } = await supabase
      .from("site_settings")
      .select("id")
      .eq("key", "site_theme")
      .maybeSingle();

    let error;
    if (existing) {
      ({ error } = await supabase
        .from("site_settings")
        .update({ value: themeId, updated_at: new Date().toISOString() })
        .eq("key", "site_theme"));
    } else {
      ({ error } = await supabase
        .from("site_settings")
        .insert({ key: "site_theme", value: themeId }));
    }

    if (error) {
      toast({ title: "Error", description: "Failed to save theme.", variant: "destructive" });
    } else {
      toast({ title: "Theme Updated", description: `Site theme changed to ${themeOptions.find(t => t.id === themeId)?.name}.` });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Settings
        </h2>
        <p className="text-sm text-muted-foreground">Manage your store settings</p>
      </div>

      <div className="space-y-6 max-w-lg">
        {/* Payment Method */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold text-lg mb-4">Payment Method</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                {paymentMode === "paystack" ? (
                  <CreditCard className="h-5 w-5 text-primary" />
                ) : (
                  <Upload className="h-5 w-5 text-primary" />
                )}
                <div>
                  <Label className="text-sm font-medium">
                    {paymentMode === "paystack" ? "Paystack (Online Payment)" : "Receipt Upload"}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {paymentMode === "paystack"
                      ? "Customers pay online via card, bank transfer, or USSD"
                      : "Customers upload a screenshot of their payment receipt"}
                  </p>
                </div>
              </div>
              <Switch
                checked={paymentMode === "receipt_upload"}
                onCheckedChange={togglePaymentMode}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Toggle to switch between Paystack online payment and manual receipt upload.
            </p>
          </div>
        </div>

        {/* Theme Color */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold text-lg mb-1 flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            Site Theme Color
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            Change the accent color across the entire website
          </p>
          <RadioGroup value={selectedTheme} onValueChange={handleThemeChange} className="grid grid-cols-2 gap-3">
            {themeOptions.map((theme) => (
              <label
                key={theme.id}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                  selectedTheme === theme.id
                    ? "border-primary bg-primary/10 ring-1 ring-primary"
                    : "border-border hover:border-muted-foreground/30 bg-muted/30"
                }`}
              >
                <RadioGroupItem value={theme.id} className="sr-only" />
                <div className={`h-8 w-8 rounded-full ${theme.preview} shadow-md ring-2 ring-background`} />
                <span className="text-sm font-medium">{theme.name}</span>
              </label>
            ))}
          </RadioGroup>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminSettings;
