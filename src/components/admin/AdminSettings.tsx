import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Settings, CreditCard, Upload } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AdminSettings = () => {
  const { toast } = useToast();
  const [paymentMode, setPaymentMode] = useState<string>("paystack");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPaymentMode();
  }, []);

  const fetchPaymentMode = async () => {
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "payment_mode")
      .maybeSingle();
    if (data) setPaymentMode(data.value);
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

      <div className="bg-card border border-border rounded-xl p-6 space-y-6 max-w-lg">
        <div>
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
              Toggle to switch between Paystack online payment and manual receipt upload. When receipt upload is active, customers will upload a screenshot of their payment which you can review in order details.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminSettings;
