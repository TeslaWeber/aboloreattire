import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, preset } = await req.json();

    if (!imageUrl || !preset) {
      return new Response(
        JSON.stringify({ error: "imageUrl and preset are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const presetPrompts: Record<string, string> = {
      mannequin_grass: "Place this clothing item on a mannequin displayed in a professional studio with a grass carpet wall and floor background. Keep the garment clearly visible with elegant studio lighting. The mannequin should be in a natural standing pose.",
      mannequin_white: "Place this clothing item on a mannequin in a professional studio with a clean white background. The garment should be clearly visible with soft, even studio lighting. The mannequin should be in a natural standing pose.",
      mannequin_boutique: "Display this clothing item on a mannequin in a modern high-end boutique setting with warm ambient lighting, wooden shelves, and elegant decor in the background. The garment should be the focal point.",
      mannequin_marble: "Place this clothing item on a mannequin in a luxury setting with a marble floor and soft golden lighting. The overall feel should be premium and sophisticated.",
      flat_lay: "Transform this into a professional flat-lay product photo on a clean marble surface, neatly arranged with minimal accessories. Top-down view with soft natural lighting.",
    };

    const prompt = presetPrompts[preset] || presetPrompts.mannequin_grass;

    console.log("Transforming image with Gemini API, preset:", preset);

    // Fetch the source image and convert to base64
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch source image: ${imageResponse.status}`);
    }
    const imageBuffer = await imageResponse.arrayBuffer();
    const bytes = new Uint8Array(imageBuffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i += 8192) {
      const chunk = bytes.subarray(i, Math.min(i + 8192, bytes.length));
      for (let j = 0; j < chunk.length; j++) {
        binary += String.fromCharCode(chunk[j]);
      }
    }
    const imageBase64 = btoa(binary);
    const contentType = imageResponse.headers.get("content-type") || "image/jpeg";

    // Call Gemini API directly
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: contentType,
                    data: imageBase64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"],
          },
        }),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      console.error("Gemini API error:", response.status, text);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`Gemini API error: ${response.status} - ${text}`);
    }

    const data = await response.json();

    // Extract base64 image from Gemini response
    let imageData: string | null = null;
    const parts = data.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData) {
          imageData = part.inlineData.data;
          break;
        }
      }
    }

    if (!imageData) {
      console.error("No image in response:", JSON.stringify(data).slice(0, 500));
      throw new Error("No image was generated");
    }

    // Upload base64 image to Supabase storage
    const binaryData = Uint8Array.from(atob(imageData), (c) => c.charCodeAt(0));

    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const fileName = `products/ai-${Date.now()}-${Math.random().toString(36).substring(2)}.png`;

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(fileName, binaryData, { contentType: "image/png" });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error(`Failed to upload: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from("product-images")
      .getPublicUrl(fileName);

    return new Response(
      JSON.stringify({ transformedImageUrl: publicUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("transform-image error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
