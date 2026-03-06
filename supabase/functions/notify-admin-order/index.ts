const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, customerName, customerEmail, customerPhone, total, paymentMethod, deliveryState, deliveryCity, items } = await req.json();

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return new Response(JSON.stringify({ error: "Email not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const itemsList = (items || [])
      .map((i: any) => `<tr><td style="padding:8px;border-bottom:1px solid #eee;">${i.product_name}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">x${i.quantity}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">₦${Number(i.price * i.quantity).toLocaleString()}</td></tr>`)
      .join("");

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff;">
        <h2 style="color: #333; border-bottom: 2px solid #d4a574; padding-bottom: 10px;">🛒 New Order Received!</h2>
        <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <p style="margin: 5px 0;"><strong>Order ID:</strong> ${orderId}</p>
          <p style="margin: 5px 0;"><strong>Customer:</strong> ${customerName}</p>
          <p style="margin: 5px 0;"><strong>Email:</strong> ${customerEmail}</p>
          <p style="margin: 5px 0;"><strong>Phone:</strong> ${customerPhone}</p>
          <p style="margin: 5px 0;"><strong>Delivery:</strong> ${deliveryCity}, ${deliveryState}</p>
          <p style="margin: 5px 0;"><strong>Payment Method:</strong> ${paymentMethod}</p>
          <p style="margin: 5px 0; font-size: 18px; color: #16a34a;"><strong>Total: ₦${Number(total).toLocaleString()}</strong></p>
        </div>
        ${itemsList ? `<table style="width:100%;border-collapse:collapse;margin-top:10px;"><thead><tr style="background:#f0f0f0;"><th style="padding:8px;text-align:left;">Item</th><th style="padding:8px;text-align:center;">Qty</th><th style="padding:8px;text-align:right;">Price</th></tr></thead><tbody>${itemsList}</tbody></table>` : ""}
        <p style="color: #888; font-size: 12px; margin-top: 20px;">This is an automated notification from ABOLORE COUTURE.</p>
      </div>
    `;

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "ABOLORE COUTURE <onboarding@resend.dev>",
        to: ["abolorecouture@gmail.com"],
        subject: `New Order from ${customerName} - ₦${Number(total).toLocaleString()}`,
        html: emailHtml,
      }),
    });

    if (!emailRes.ok) {
      const errText = await emailRes.text();
      console.error("Resend email failed:", errText);
      return new Response(JSON.stringify({ sent: false, error: errText }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Admin notification email sent for order:", orderId);
    return new Response(JSON.stringify({ sent: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Notification error:", error);
    return new Response(JSON.stringify({ error: "Failed to send notification" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
