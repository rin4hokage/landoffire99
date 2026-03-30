import { Polar } from "npm:@polar-sh/sdk";
import { createClient } from "npm:@supabase/supabase-js@2";

const allowedOrigins = (
  Deno.env.get("ALLOWED_APP_ORIGINS") ??
  [
    "http://127.0.0.1:4327",
    "http://localhost:4327",
    "https://landoffire99.lovable.app",
  ].join(",")
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const getAllowedOrigin = (origin: string | null) => {
  if (origin && allowedOrigins.includes(origin)) {
    return origin;
  }

  return allowedOrigins[0] ?? "http://127.0.0.1:4327";
};

const buildCorsHeaders = (origin: string | null) => ({
  "Access-Control-Allow-Origin": getAllowedOrigin(origin),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
});

const polar = new Polar({
  accessToken: Deno.env.get("POLAR_ACCESS_TOKEN") ?? "",
  server: (Deno.env.get("POLAR_SERVER") ?? "production") as "sandbox" | "production",
});

type CheckoutCartItem = {
  beatId: string;
  license: string;
};

const getProductIdForLicense = (license: string) => {
  if (license === "Basic Lease") {
    return Deno.env.get("POLAR_BASIC_PRODUCT_ID") ?? "";
  }

  if (license === "Exclusive Lease") {
    return Deno.env.get("POLAR_PREMIUM_PRODUCT_ID") ?? "";
  }

  return "";
};

const sanitizeCartItems = (value: unknown): CheckoutCartItem[] => {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];

    const beatId = typeof item.beatId === "string" ? item.beatId.trim() : "";
    const license = typeof item.license === "string" ? item.license.trim() : "";

    if (!beatId || !getProductIdForLicense(license)) {
      return [];
    }

    return [{ beatId, license }];
  });
};

const normalizeReturnUrl = (value: unknown) => {
  if (typeof value !== "string" || !value.trim()) return null;

  try {
    const url = new URL(value);
    return allowedOrigins.includes(url.origin) ? url.origin : null;
  } catch {
    return null;
  }
};

const signCartItems = async (cartItems: CheckoutCartItem[]) => {
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
  }

  const encoder = new TextEncoder();
  const signingKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(serviceRoleKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const payload = JSON.stringify(cartItems);
  const signatureBuffer = await crypto.subtle.sign("HMAC", signingKey, encoder.encode(payload));
  const signature = Array.from(new Uint8Array(signatureBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  return { payload, signature };
};

Deno.serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req.headers.get("Origin"));

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const authorization = req.headers.get("Authorization");
    if (!authorization) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const token = authorization.replace("Bearer ", "");
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const body = await req.json();
    const cartItems = sanitizeCartItems(body.cartItems);
    const returnUrl = normalizeReturnUrl(body.returnUrl);

    if (!cartItems.length) {
      return new Response(JSON.stringify({ error: "Cart is empty" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    if (!returnUrl) {
      return new Response(JSON.stringify({ error: "Invalid returnUrl" }), {
        status: 400,
        headers: corsHeaders,
      });
    }
    const { payload, signature } = await signCartItems(cartItems);

    const checkout = await polar.checkouts.create({
      products: cartItems.map((item) => getProductIdForLicense(item.license)),
      successUrl: `${returnUrl}/?checkout=success&checkout_id={CHECKOUT_ID}`,
      customerEmail: user.email ?? undefined,
      customerName:
        typeof user.user_metadata?.full_name === "string"
          ? user.user_metadata.full_name
          : typeof user.user_metadata?.name === "string"
            ? user.user_metadata.name
            : undefined,
      externalCustomerId: user.id,
      metadata: {
        cart_items: payload,
        cart_signature: signature,
        source: "void-storefront",
        user_id: user.id,
      },
    });

    return new Response(
      JSON.stringify({
        checkoutId: checkout.id,
        url: checkout.url,
      }),
      {
        status: 200,
        headers: corsHeaders,
      },
    );
  } catch (error) {
    console.error("Failed to create Polar checkout.", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown checkout error",
      }),
      {
        status: 500,
        headers: corsHeaders,
      },
    );
  }
});
