import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Simple password hashing using Web Crypto API (SHA-256 + salt)
async function hashPassword(password: string, salt?: string): Promise<{ hash: string; salt: string }> {
  const s = salt || crypto.randomUUID();
  const encoder = new TextEncoder();
  const data = encoder.encode(s + password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  return { hash: s + ":" + hash, salt: s };
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt] = storedHash.split(":");
  const { hash } = await hashPassword(password, salt);
  return hash === storedHash;
}

// Simple JWT-like token using HMAC-SHA256
async function createToken(payload: Record<string, unknown>, secret: string): Promise<string> {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 86400 }));
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(`${header}.${body}`));
  const signature = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return `${header}.${body}.${signature}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, email, password, name, role, department, permissions, userId } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const jwtSecret = Deno.env.get("GATEWAY_JWT_SECRET") || serviceRoleKey.slice(0, 32);

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // === LOGIN ===
    if (action === "login") {
      if (!email || !password) {
        return new Response(JSON.stringify({ error: "Email e senha obrigatórios" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: user, error } = await supabase
        .from("gateway_users")
        .select("*")
        .eq("email", email.toLowerCase().trim())
        .eq("is_active", true)
        .maybeSingle();

      if (error || !user) {
        return new Response(JSON.stringify({ error: "Credenciais inválidas" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const valid = await verifyPassword(password, user.password_hash);
      if (!valid) {
        return new Response(JSON.stringify({ error: "Credenciais inválidas" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update last_login_at
      await supabase.from("gateway_users").update({ last_login_at: new Date().toISOString() }).eq("id", user.id);

      const token = await createToken({
        sub: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
        permissions: user.permissions,
      }, jwtSecret);

      return new Response(JSON.stringify({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          department: user.department,
          permissions: user.permissions,
        },
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === CREATE USER ===
    if (action === "create-user") {

      if (!email || !password || !name) {
        return new Response(JSON.stringify({ error: "Email, senha e nome são obrigatórios" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { hash } = await hashPassword(password);

      const { data: newUser, error: insertErr } = await supabase
        .from("gateway_users")
        .insert({
          email: email.toLowerCase().trim(),
          password_hash: hash,
          name,
          role: role || "user",
          department: department || null,
          permissions: permissions || {},
        })
        .select("id, email, name, role, department, permissions, is_active, created_at")
        .single();

      if (insertErr) {
        const msg = insertErr.message.includes("duplicate") ? "Email já cadastrado" : insertErr.message;
        return new Response(JSON.stringify({ error: msg }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ user: newUser }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === RESET PASSWORD ===
    if (action === "reset-password") {

      if (!userId || !password) {
        return new Response(JSON.stringify({ error: "userId e senha obrigatórios" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const { hash } = await hashPassword(password);
      const { error: upErr } = await supabase.from("gateway_users").update({ password_hash: hash }).eq("id", userId);
      if (upErr) {
        return new Response(JSON.stringify({ error: upErr.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Ação inválida" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
