const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, customerName, customerPhone, total, paymentMethod, type, newStatus, changeType } = await req.json();

    const WHATSAPP_ACCESS_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
    const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
    const ADMIN_WHATSAPP = Deno.env.get("ADMIN_WHATSAPP_NUMBER") || "2348000000000";

    if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
      console.error("WhatsApp credentials not configured");
      return new Response(JSON.stringify({ error: "WhatsApp not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sendWhatsApp = async (to: string, message: string) => {
      const res = await fetch(
        `https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to,
            type: "text",
            text: { body: message },
          }),
        }
      );
      if (!res.ok) {
        const err = await res.text();
        console.error(`WhatsApp send failed to ${to}:`, err);
        return false;
      }
      return true;
    };

    // Format phone number for WhatsApp (ensure country code)
    const formatPhone = (phone: string): string => {
      let cleaned = phone.replace(/[^0-9]/g, "");
      if (cleaned.startsWith("0")) {
        cleaned = "234" + cleaned.slice(1); // Nigeria country code
      }
      if (!cleaned.startsWith("234")) {
        cleaned = "234" + cleaned;
      }
      return cleaned;
    };

    if (type === "new_order") {
      // Notify admin
      const adminMsg = `🛒 *New Order Received!*\n\n` +
        `*Customer:* ${customerName}\n` +
        `*Phone:* ${customerPhone}\n` +
        `*Total:* ₦${Number(total).toLocaleString()}\n` +
        `*Payment:* ${paymentMethod}\n` +
        `*Order ID:* ${orderId.slice(0, 8)}...\n\n` +
        `Check your admin dashboard for details.`;

      await sendWhatsApp(ADMIN_WHATSAPP, adminMsg);

      // Notify customer
      if (customerPhone) {
        const customerMsg = `🛍️ *Order Confirmed - ABOLORE COUTURE*\n\n` +
          `Hi ${customerName}!\n\n` +
          `Thank you for your order. We've received it and will begin processing shortly.\n\n` +
          `*Order ID:* ${orderId.slice(0, 8)}...\n` +
          `*Total:* ₦${Number(total).toLocaleString()}\n\n` +
          `We'll notify you when your order status changes. 💫`;

        await sendWhatsApp(formatPhone(customerPhone), customerMsg);
      }
    } else if (type === "status_update") {
      // Notify customer of status change
      const statusEmoji: Record<string, string> = {
        pending: "⏳", processing: "🔄", dispatched: "🚚",
        delivered: "✅", cancelled: "❌", confirmed: "✅", unsuccessful: "❌",
      };
      const emoji = statusEmoji[newStatus] || "📦";
      const typeLabel = changeType === "payment" ? "Payment Status" : "Order Status";

      if (customerPhone) {
        const msg = `${emoji} *${typeLabel} Update - ABOLORE COUTURE*\n\n` +
          `Hi ${customerName},\n\n` +
          `Your ${changeType === "payment" ? "payment status" : "order status"} has been updated to: *${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}*\n\n` +
          `*Order ID:* ${orderId.slice(0, 8)}...\n\n` +
          `Thank you for shopping with ABOLORE COUTURE! 💫`;

        await sendWhatsApp(formatPhone(customerPhone), msg);
      }
    }

    return new Response(JSON.stringify({ sent: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("WhatsApp notification error:", error);
    return new Response(JSON.stringify({ error: "Failed to send WhatsApp" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
