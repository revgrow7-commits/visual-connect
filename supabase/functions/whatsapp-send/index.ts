import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, message, origin, client_id, client_name } = await req.json();

    if (!phone || !message) {
      return new Response(JSON.stringify({ error: "phone and message are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ZAPI_INSTANCE_ID = Deno.env.get("ZAPI_INSTANCE_ID");
    const ZAPI_TOKEN = Deno.env.get("ZAPI_TOKEN");
    const ZAPI_CLIENT_TOKEN = Deno.env.get("ZAPI_CLIENT_TOKEN");

    if (!ZAPI_INSTANCE_ID || !ZAPI_TOKEN) {
      return new Response(JSON.stringify({ error: "Z-API credentials not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create Supabase client to log the message
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Log the outbound message as pending
    const { data: log, error: logError } = await supabase
      .from("whatsapp_logs")
      .insert({
        phone,
        message,
        direction: "outbound",
        status: "pending",
        origin: origin || "manual",
        customer_id: client_id ? Number(client_id) : null,
        customer_name: client_name || null,
      })
      .select()
      .single();

    if (logError) {
      console.error("Log insert error:", logError);
    }

    // 2. Send via Z-API
    const cleanPhone = phone.replace(/\D/g, "");
    const zapiUrl = `https://api.z-api.io/instances/${ZAPI_INSTANCE_ID}/token/${ZAPI_TOKEN}/send-text`;
    

    const zapiRes = await fetch(zapiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone: cleanPhone,
        message,
      }),
    });

    const zapiData = await zapiRes.json();

    if (!zapiRes.ok) {
      console.error("Z-API error:", zapiData);
      // Update log as failed
      if (log?.id) {
        await supabase
          .from("whatsapp_logs")
          .update({ status: "failed", error_message: JSON.stringify(zapiData) })
          .eq("id", log.id);
      }
      return new Response(JSON.stringify({ error: "Z-API send failed", details: zapiData }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Update log as sent
    if (log?.id) {
      await supabase
        .from("whatsapp_logs")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          evolution_message_id: zapiData?.messageId || zapiData?.zapiMessageId || null,
        })
        .eq("id", log.id);
    }

    return new Response(JSON.stringify({ success: true, messageId: zapiData?.messageId, logId: log?.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("whatsapp-send error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
