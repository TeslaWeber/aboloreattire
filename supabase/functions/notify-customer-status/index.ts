const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { customerEmail, customerName, orderId, changeType, newStatus, total, items } = await req.json();

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return new Response(JSON.stringify({ error: "Email not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle order confirmation email
    if (changeType === "order_placed") {
      const itemsList = (items || [])
        .map((i: any) => `<tr><td style="padding:8px;border-bottom:1px solid #eee;">${i.product_name}</td><td style="padding:8px;text-align:center;border-bottom:1px solid #eee;">x${i.quantity}</td><td style="padding:8px;text-align:right;border-bottom:1px solid #eee;">₦${Number(i.price * i.quantity).toLocaleString()}</td></tr>`)
        .join("");

      const confirmationHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff;">
          <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #d4a574;">
            <h1 style="color: #333; margin: 0; font-size: 24px;">A.B.Couture</h1>
          </div>
          <div style="padding: 30px 0;">
            <h2 style="color: #16a34a;">🛍️ Order Confirmed!</h2>
            <p style="color: #555; font-size: 16px;">Hi ${customerName},</p>
            <p style="color: #555; font-size: 16px;">Thank you for your order! We've received it and will begin processing shortly.</p>
            <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Order ID:</strong> <span style="font-family: monospace;">${orderId.slice(0, 8)}...</span></p>
              <p style="margin: 5px 0; font-size: 18px; color: #16a34a;"><strong>Total: ₦${Number(total).toLocaleString()}</strong></p>
            </div>
            ${itemsList ? `<table style="width:100%;border-collapse:collapse;"><thead><tr style="background:#f0f0f0;"><th style="padding:8px;text-align:left;">Item</th><th style="padding:8px;text-align:center;">Qty</th><th style="padding:8px;text-align:right;">Price</th></tr></thead><tbody>${itemsList}</tbody></table>` : ""}
            <p style="color: #555; margin-top: 20px;">We'll notify you when your order status changes.</p>
            <p style="color: #888; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">Thank you for shopping with A.B.Couture!</p>
          </div>
        </div>
      `;

      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "A.B.Couture <onboarding@resend.dev>",
          to: [customerEmail],
          subject: `🛍️ Order Confirmed - Thank you, ${customerName}!`,
          html: confirmationHtml,
        }),
      });

      if (!emailRes.ok) {
        const errText = await emailRes.text();
        console.error("Order confirmation email failed:", errText);
        return new Response(JSON.stringify({ sent: false, error: errText }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`Order confirmation email sent to ${customerEmail} for order ${orderId}`);
      return new Response(JSON.stringify({ sent: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const statusLabels: Record<string, string> = {
      pending: "Pending",
      processing: "Processing",
      dispatched: "Dispatched",
      delivered: "Delivered",
      cancelled: "Cancelled",
      confirmed: "Confirmed",
      unsuccessful: "Unsuccessful",
    };

    const statusEmoji: Record<string, string> = {
      pending: "⏳",
      processing: "🔄",
      dispatched: "🚚",
      delivered: "✅",
      cancelled: "❌",
      confirmed: "✅",
      unsuccessful: "❌",
    };

    const emoji = statusEmoji[newStatus] || "📦";
    const label = statusLabels[newStatus] || newStatus;
    const typeLabel = changeType === "payment" ? "Payment Status" : "Order Status";

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff;">
        <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #d4a574;">
          <h1 style="color: #333; margin: 0; font-size: 24px;">A.B.Couture</h1>
        </div>
        <div style="padding: 30px 0;">
          <h2 style="color: #333;">${emoji} ${typeLabel} Update</h2>
          <p style="color: #555; font-size: 16px;">Hi ${customerName},</p>
          <p style="color: #555; font-size: 16px;">Your ${changeType === "payment" ? "payment status" : "order status"} has been updated:</p>
          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; font-size: 14px; color: #888;">Order ID</p>
            <p style="margin: 5px 0; font-size: 14px; color: #333; font-family: monospace;">${orderId.slice(0, 8)}...</p>
            <p style="margin: 15px 0 0; font-size: 14px; color: #888;">${typeLabel}</p>
            <p style="margin: 5px 0; font-size: 20px; font-weight: bold; color: #d4a574;">${emoji} ${label}</p>
          </div>
          ${newStatus === "dispatched" ? '<p style="color: #555;">Your order is on its way! You will receive it soon.</p>' : ""}
          ${newStatus === "delivered" ? '<p style="color: #555;">Your order has been delivered. Thank you for shopping with us!</p>' : ""}
          ${newStatus === "confirmed" ? '<p style="color: #555;">Your payment has been confirmed. We are now processing your order.</p>' : ""}
          ${newStatus === "cancelled" ? '<p style="color: #555;">If you have questions about this, please contact us.</p>' : ""}
          <p style="color: #888; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">This is an automated email from A.B.Couture. Please do not reply.</p>
        </div>
      </div>
    `;

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "A.B.Couture <onboarding@resend.dev>",
        to: [customerEmail],
        subject: `${emoji} ${typeLabel} Update - ${label}`,
        html: emailHtml,
      }),
    });

    if (!emailRes.ok) {
      const errText = await emailRes.text();
      console.error("Resend customer email failed:", errText);
      return new Response(JSON.stringify({ sent: false, error: errText }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Customer status email sent to ${customerEmail} for order ${orderId}: ${changeType} -> ${newStatus}`);
    return new Response(JSON.stringify({ sent: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Customer notification error:", error);
    return new Response(JSON.stringify({ error: "Failed to send notification" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
