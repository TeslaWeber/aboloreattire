import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-paystack-signature",
};

async function verifySignature(secret: string, body: string, signature: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const hash = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hash === signature;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!PAYSTACK_SECRET_KEY) {
      return new Response("Configuration error", { status: 500 });
    }

    const body = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    // Verify webhook signature
    if (signature) {
      const isValid = await verifySignature(PAYSTACK_SECRET_KEY, body, signature);
      if (!isValid) {
        console.error("Invalid webhook signature");
        return new Response("Invalid signature", { status: 401 });
      }
    }

    const event = JSON.parse(body);
    console.log("Paystack webhook event:", event.event);

    if (event.event === "charge.success") {
      const { reference, metadata, customer } = event.data;
      const orderId = metadata?.order_id || reference;

      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      // Update order status and payment status
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          payment_status: "confirmed",
          status: "processing",
        })
        .eq("id", orderId);

      if (updateError) {
        console.error("Failed to update order:", updateError);
        return new Response("Order update failed", { status: 500 });
      }

      console.log(`Order ${orderId} payment confirmed`);

      // Send WhatsApp notification if configured
      try {
        const WHATSAPP_ACCESS_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
        const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");

        if (WHATSAPP_ACCESS_TOKEN && WHATSAPP_PHONE_NUMBER_ID) {
          // Fetch order details
          const { data: order } = await supabase
            .from("orders")
            .select("*")
            .eq("id", orderId)
            .single();

          if (order) {
            const message = `✅ *Payment Confirmed!*\n\n` +
              `*Customer:* ${order.customer_name}\n` +
              `*Email:* ${order.customer_email}\n` +
              `*Phone:* ${order.customer_phone}\n` +
              `*Amount:* ₦${Number(order.total).toLocaleString()}\n` +
              `*Method:* Card (Paystack)\n` +
              `*Order ID:* ${orderId}`;

            await fetch(
              `https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
              {
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
              }
            );
          }
        }
      } catch (whatsappError) {
        console.error("WhatsApp notification error:", whatsappError);
        // Don't fail the webhook for notification errors
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response("Webhook processing failed", { status: 500 });
  }
});
