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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(JSON.stringify({ error: "Email not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const itemsList = (items || [])
      .map((i: any) => `• ${i.product_name} (x${i.quantity}) - ₦${Number(i.price * i.quantity).toLocaleString()}`)
      .join("\n");

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333; border-bottom: 2px solid #e5e5e5; padding-bottom: 10px;">🛒 New Order Received!</h2>
        <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <p style="margin: 5px 0;"><strong>Order ID:</strong> ${orderId}</p>
          <p style="margin: 5px 0;"><strong>Customer:</strong> ${customerName}</p>
          <p style="margin: 5px 0;"><strong>Email:</strong> ${customerEmail}</p>
          <p style="margin: 5px 0;"><strong>Phone:</strong> ${customerPhone}</p>
          <p style="margin: 5px 0;"><strong>Delivery:</strong> ${deliveryCity}, ${deliveryState}</p>
          <p style="margin: 5px 0;"><strong>Payment Method:</strong> ${paymentMethod}</p>
          <p style="margin: 5px 0; font-size: 18px; color: #16a34a;"><strong>Total: ₦${Number(total).toLocaleString()}</strong></p>
        </div>
        ${itemsList ? `<div style="background: #fff; padding: 15px; border: 1px solid #e5e5e5; border-radius: 8px;"><h3 style="margin-top: 0;">Items:</h3><pre style="white-space: pre-wrap; font-family: Arial;">${itemsList}</pre></div>` : ""}
        <p style="color: #888; font-size: 12px; margin-top: 20px;">This is an automated notification from Abolore Wearables.</p>
      </div>
    `;

    // Use Lovable's transactional email capability
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const projectId = SUPABASE_URL.replace("https://", "").replace(".supabase.co", "");

    const emailRes = await fetch(`https://api.lovable.dev/v1/projects/${projectId}/emails/send`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: "abolorecouture@gmail.com",
        subject: `New Order from ${customerName} - ₦${Number(total).toLocaleString()}`,
        html: emailHtml,
        purpose: "transactional",
      }),
    });

    if (!emailRes.ok) {
      const errText = await emailRes.text();
      console.error("Email send failed:", errText);
      
      // Fallback: Try WhatsApp notification
      const WHATSAPP_ACCESS_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
      const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
      
      if (WHATSAPP_ACCESS_TOKEN && WHATSAPP_PHONE_NUMBER_ID) {
        const message = `🛒 *New Order!*\n\n*Customer:* ${customerName}\n*Phone:* ${customerPhone}\n*Amount:* ₦${Number(total).toLocaleString()}\n*Method:* ${paymentMethod}\n*Location:* ${deliveryCity}, ${deliveryState}`;
        
        await fetch(`https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: "2348069535463",
            type: "text",
            text: { body: message },
          }),
        });
      }
      
      return new Response(JSON.stringify({ sent: false, fallback: "whatsapp" }), {
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
