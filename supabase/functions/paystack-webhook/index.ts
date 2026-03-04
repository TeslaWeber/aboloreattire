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
      const { reference, metadata } = event.data;
      const orderId = metadata?.order_id || reference;

      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

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

      // Send admin email via Resend
      try {
        const { data: order } = await supabase
          .from("orders")
          .select("*")
          .eq("id", orderId)
          .single();

        if (order) {
          const { data: orderItems } = await supabase
            .from("order_items")
            .select("*")
            .eq("order_id", orderId);

          const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

          if (RESEND_API_KEY) {
            const itemsList = (orderItems || [])
              .map((i: any) => `<tr><td style="padding:8px;border-bottom:1px solid #eee;">${i.product_name}</td><td style="padding:8px;text-align:center;border-bottom:1px solid #eee;">x${i.quantity}</td><td style="padding:8px;text-align:right;border-bottom:1px solid #eee;">₦${Number(i.price * i.quantity).toLocaleString()}</td></tr>`)
              .join("");

            const emailHtml = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff;">
                <h2 style="color: #16a34a; border-bottom: 2px solid #d4a574; padding-bottom: 10px;">✅ Payment Confirmed via Paystack!</h2>
                <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 15px 0;">
                  <p><strong>Order ID:</strong> ${orderId}</p>
                  <p><strong>Customer:</strong> ${order.customer_name}</p>
                  <p><strong>Email:</strong> ${order.customer_email}</p>
                  <p><strong>Phone:</strong> ${order.customer_phone}</p>
                  <p><strong>Delivery:</strong> ${order.delivery_city}, ${order.delivery_state}</p>
                  <p style="font-size: 18px; color: #16a34a;"><strong>Total: ₦${Number(order.total).toLocaleString()}</strong></p>
                </div>
                ${itemsList ? `<table style="width:100%;border-collapse:collapse;"><thead><tr style="background:#f0f0f0;"><th style="padding:8px;text-align:left;">Item</th><th style="padding:8px;text-align:center;">Qty</th><th style="padding:8px;text-align:right;">Price</th></tr></thead><tbody>${itemsList}</tbody></table>` : ""}
              </div>
            `;

            await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${RESEND_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: "Abolore Couture <onboarding@resend.dev>",
                to: ["abolorecouture@gmail.com"],
                subject: `✅ Payment Confirmed - ${order.customer_name} - ₦${Number(order.total).toLocaleString()}`,
                html: emailHtml,
              }),
            });

            // Also notify customer
            await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${RESEND_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: "Abolore Couture <onboarding@resend.dev>",
                to: [order.customer_email],
                subject: `✅ Payment Confirmed - Your order is being processed`,
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff;">
                    <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #d4a574;">
                      <h1 style="color: #333; margin: 0;">ABOLORE COUTURE</h1>
                    </div>
                    <div style="padding: 30px 0;">
                      <h2 style="color: #16a34a;">✅ Payment Confirmed!</h2>
                      <p>Hi ${order.customer_name},</p>
                      <p>Your payment of <strong>₦${Number(order.total).toLocaleString()}</strong> has been confirmed. Your order is now being processed.</p>
                      <p style="color: #888; font-size: 12px; margin-top: 30px;">Thank you for shopping with Abolore Couture!</p>
                    </div>
                  </div>
                `,
              }),
            });
          }
        }
      } catch (notifyError) {
        console.error("Notification error:", notifyError);
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
