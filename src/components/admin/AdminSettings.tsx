import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Settings, CreditCard, Upload, Palette, Timer, MessageSquare } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
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
  {
    id: "teal",
    name: "Teal",
    preview: "bg-[hsl(185,60%,45%)]",
    colors: {
      primary: "185 60% 45%",
      accent: "185 60% 45%",
      ring: "185 60% 45%",
      goldLight: "185 70% 60%",
      goldDark: "185 50% 30%",
      roseGold: "175 50% 50%",
    },
  },
  {
    id: "crimson",
    name: "Crimson",
    preview: "bg-[hsl(0,70%,50%)]",
    colors: {
      primary: "0 70% 50%",
      accent: "0 70% 50%",
      ring: "0 70% 50%",
      goldLight: "0 80% 65%",
      goldDark: "0 60% 35%",
      roseGold: "10 55% 55%",
    },
  },
  {
    id: "indigo",
    name: "Indigo",
    preview: "bg-[hsl(240,55%,55%)]",
    colors: {
      primary: "240 55% 55%",
      accent: "240 55% 55%",
      ring: "240 55% 55%",
      goldLight: "240 65% 70%",
      goldDark: "240 45% 40%",
      roseGold: "250 50% 55%",
    },
  },
  {
    id: "coral",
    name: "Coral",
    preview: "bg-[hsl(16,80%,60%)]",
    colors: {
      primary: "16 80% 60%",
      accent: "16 80% 60%",
      ring: "16 80% 60%",
      goldLight: "16 85% 72%",
      goldDark: "16 65% 45%",
      roseGold: "8 60% 58%",
    },
  },
  {
    id: "slate",
    name: "Slate",
    preview: "bg-[hsl(210,15%,45%)]",
    colors: {
      primary: "210 15% 45%",
      accent: "210 15% 45%",
      ring: "210 15% 45%",
      goldLight: "210 20% 60%",
      goldDark: "210 12% 30%",
      roseGold: "200 15% 50%",
    },
  },
  {
    id: "magenta",
    name: "Magenta",
    preview: "bg-[hsl(300,60%,50%)]",
    colors: {
      primary: "300 60% 50%",
      accent: "300 60% 50%",
      ring: "300 60% 50%",
      goldLight: "300 70% 65%",
      goldDark: "300 50% 35%",
      roseGold: "310 55% 55%",
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
  const [tickerSpeed, setTickerSpeed] = useState<number>(60);
  const [tickerMessage, setTickerMessage] = useState<string>("Welcome to ABOLORE COUTURE — Thank you for choosing us — Enjoy your shopping");
  const [savingMessage, setSavingMessage] = useState(false);
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

    const { data: tickerData } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "ticker_speed")
      .maybeSingle();
    if (tickerData) {
      setTickerSpeed(Number(tickerData.value));
    }

    const { data: messageData } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "ticker_message")
      .maybeSingle();
    if (messageData) {
      setTickerMessage(messageData.value);
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

  const handleSaveMessage = async () => {
    setSavingMessage(true);
    const { data: existing } = await supabase
      .from("site_settings")
      .select("id")
      .eq("key", "ticker_message")
      .maybeSingle();

    let error;
    if (existing) {
      ({ error } = await supabase
        .from("site_settings")
        .update({ value: tickerMessage, updated_at: new Date().toISOString() })
        .eq("key", "ticker_message"));
    } else {
      ({ error } = await supabase
        .from("site_settings")
        .insert({ key: "ticker_message", value: tickerMessage }));
    }

    setSavingMessage(false);
    if (error) {
      toast({ title: "Error", description: "Failed to save ticker message.", variant: "destructive" });
    } else {
      toast({ title: "Ticker Message Updated", description: "The announcement bar text has been updated." });
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

        {/* Ticker Speed */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold text-lg mb-1 flex items-center gap-2">
            <Timer className="h-5 w-5 text-primary" />
            News Ticker Speed
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            Control how fast the announcement bar scrolls ({tickerSpeed}s per cycle)
          </p>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Fast (15s)</span>
              <span>Slow (120s)</span>
            </div>
            <Slider
              value={[tickerSpeed]}
              min={15}
              max={120}
              step={5}
              onValueChange={([val]) => setTickerSpeed(val)}
              onValueCommit={async ([val]) => {
                const { data: existing } = await supabase
                  .from("site_settings")
                  .select("id")
                  .eq("key", "ticker_speed")
                  .maybeSingle();

                let error;
                if (existing) {
                  ({ error } = await supabase
                    .from("site_settings")
                    .update({ value: String(val), updated_at: new Date().toISOString() })
                    .eq("key", "ticker_speed"));
                } else {
                  ({ error } = await supabase
                    .from("site_settings")
                    .insert({ key: "ticker_speed", value: String(val) }));
                }

                if (error) {
                  toast({ title: "Error", description: "Failed to save ticker speed.", variant: "destructive" });
                } else {
                  toast({ title: "Ticker Speed Updated", description: `Scroll speed set to ${val}s per cycle.` });
                }
              }}
            />
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
          <RadioGroup value={selectedTheme} onValueChange={handleThemeChange} className="grid grid-cols-3 gap-3">
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
