import { Polar } from "npm:@polar-sh/sdk";
import { validateEvent, WebhookVerificationError } from "npm:@polar-sh/sdk/webhooks";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://voidarchive.xyz",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

const polar = new Polar({
  accessToken: Deno.env.get("POLAR_ACCESS_TOKEN") ?? "",
  server: (Deno.env.get("POLAR_SERVER") ?? "production") as "sandbox" | "production",
});

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

type PurchasedBeat = {
  beatId: string;
  license: string;
};

const getPriceForLicense = (license: string) => {
  if (license === "Basic Lease") return 2000;
  if (license === "Exclusive Lease") return 10000;
  return null;
};

const createLicenseKey = () =>
  `VOID-${new Date().getFullYear()}-${crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase()}`;

const getLicenseExpiry = (license: string, purchasedAt: string) => {
  if (license === "Exclusive Lease") return null;
  const expiry = new Date(purchasedAt);
  expiry.setFullYear(expiry.getFullYear() + 2);
  return expiry.toISOString();
};

const getStringValue = (source: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.length > 0) {
      return value;
    }
  }
  return null;
};

const verifyCartSignature = async (payload: string, signature: string) => {
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

  const expectedBuffer = await crypto.subtle.sign("HMAC", signingKey, encoder.encode(payload));
  const expectedSignature = Array.from(new Uint8Array(expectedBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  return signature === expectedSignature;
};

Deno.serve(async (req) => {
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
    const rawBody = await req.text();
    const event = validateEvent(
      rawBody,
      req.headers,
      Deno.env.get("POLAR_WEBHOOK_SECRET") ?? "",
    );

    if (event.type !== "order.paid") {
      return new Response(JSON.stringify({ ok: true, ignored: event.type }), {
        status: 202,
        headers: corsHeaders,
      });
    }

    const eventData = event.data as Record<string, unknown>;
    const eventOrderId = getStringValue(eventData, ["id"]);
    if (!eventOrderId) {
      throw new Error("Polar webhook payload did not include an order id.");
    }

    const orderResponse = await polar.orders.get({ id: eventOrderId });
    const order = (orderResponse as { result?: Record<string, unknown> }).result ?? (eventData as Record<string, unknown>);

    const polarOrderId = getStringValue(order, ["id"]) ?? eventOrderId;
    const polarCheckoutId = getStringValue(order, ["checkoutId", "checkout_id"]);
    const metadata = (order.metadata ?? {}) as Record<string, unknown>;
    const userId = typeof metadata.user_id === "string" ? metadata.user_id : null;
    const purchasedAt = getStringValue(order, ["paidAt", "paid_at", "createdAt", "created_at"]) ?? new Date().toISOString();
    const rawCartItems = typeof metadata.cart_items === "string" ? metadata.cart_items : "";
    const cartSignature = typeof metadata.cart_signature === "string" ? metadata.cart_signature : "";

    if (!userId) {
      throw new Error("Missing user_id in Polar order metadata.");
    }

    if (!rawCartItems || !cartSignature) {
      throw new Error("Polar order metadata is missing cart verification fields.");
    }

    if (!(await verifyCartSignature(rawCartItems, cartSignature))) {
      throw new Error("Polar order metadata signature is invalid.");
    }

    const { data: existingRows, error: existingRowsError } = await supabaseAdmin
      .from("beat_sales")
      .select("id")
      .eq("polar_order_id", polarOrderId);

    if (existingRowsError) {
      throw existingRowsError;
    }

    if ((existingRows ?? []).length > 0) {
      return new Response(JSON.stringify({ ok: true, duplicate: true }), {
        status: 200,
        headers: corsHeaders,
      });
    }

    const cartItems = (() => {
      try {
        const parsed = JSON.parse(rawCartItems) as PurchasedBeat[];
        return Array.isArray(parsed)
          ? parsed.filter(
              (item): item is PurchasedBeat =>
                Boolean(item) &&
                typeof item === "object" &&
                typeof item.beatId === "string" &&
                item.beatId.trim().length > 0 &&
                typeof item.license === "string" &&
                getPriceForLicense(item.license) !== null,
            )
          : [];
      } catch {
        return [] as PurchasedBeat[];
      }
    })();

    if (!cartItems.length) {
      throw new Error("No beat items found in Polar order metadata.");
    }

    const saleRows = cartItems.map((item) => ({
      beat_id: item.beatId,
      user_id: userId,
      license_type: item.license,
      price: getPriceForLicense(item.license) ?? 0,
      license_key: createLicenseKey(),
      expires_at: getLicenseExpiry(item.license, purchasedAt),
      polar_order_id: polarOrderId,
      polar_checkout_id: polarCheckoutId,
    }));

    const { error: insertError } = await supabaseAdmin.from("beat_sales").insert(saleRows);

    if (insertError) {
      throw insertError;
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    if (error instanceof WebhookVerificationError) {
      return new Response(JSON.stringify({ error: "Invalid webhook signature" }), {
        status: 403,
        headers: corsHeaders,
      });
    }

    console.error("Polar webhook error", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown webhook error",
      }),
      {
        status: 500,
        headers: corsHeaders,
      },
    );
  }
});
