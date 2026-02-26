import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const { action, email, credential_id } = await req.json();

    if (action === "challenge") {
      // Get all credentials for the email (find user first)
      const { data: userData } = await adminClient.auth.admin.listUsers();
      const user = userData?.users?.find((u: any) => u.email === email);

      if (!user) {
        return new Response(JSON.stringify({ error: "No account found with this email" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: credentials } = await adminClient
        .from("webauthn_credentials")
        .select("credential_id")
        .eq("user_id", user.id);

      if (!credentials || credentials.length === 0) {
        return new Response(JSON.stringify({ error: "No biometric credentials registered for this account" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const challengeBase64 = btoa(String.fromCharCode(...challenge));

      return new Response(JSON.stringify({
        challenge: challengeBase64,
        credential_ids: credentials.map((c: any) => c.credential_id),
        user_id: user.id,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "verify") {
      if (!credential_id) {
        return new Response(JSON.stringify({ error: "Missing credential" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Find the credential
      const { data: cred } = await adminClient
        .from("webauthn_credentials")
        .select("*")
        .eq("credential_id", credential_id)
        .maybeSingle();

      if (!cred) {
        return new Response(JSON.stringify({ error: "Credential not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update counter
      await adminClient
        .from("webauthn_credentials")
        .update({ counter: cred.counter + 1 })
        .eq("id", cred.id);

      // Generate a magic link for the user to sign in
      const { data: userData } = await adminClient.auth.admin.getUserById(cred.user_id);
      if (!userData?.user?.email) {
        return new Response(JSON.stringify({ error: "User not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Generate a one-time sign-in link
      const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
        type: "magiclink",
        email: userData.user.email,
      });

      if (linkError || !linkData) {
        return new Response(JSON.stringify({ error: "Failed to generate sign-in session" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Return the token hash and verification type for OTP verification
      const token = linkData.properties?.hashed_token;
      
      // Use verifyOtp with the token
      const { data: sessionData, error: sessionError } = await adminClient.auth.verifyOtp({
        token_hash: token!,
        type: "magiclink",
      });

      if (sessionError || !sessionData.session) {
        return new Response(JSON.stringify({ error: "Failed to create session" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        success: true,
        access_token: sessionData.session.access_token,
        refresh_token: sessionData.session.refresh_token,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("webauthn-authenticate error:", err);
    return new Response(JSON.stringify({ error: "An error occurred. Please try again." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
