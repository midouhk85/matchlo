// Edge Function : webhook Chargily Pay v2. Vérifie la signature HMAC puis, sur
// `checkout.paid`, marque le paiement payé et crédite le quota de l'entreprise.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const CHARGILY_KEY = Deno.env.get("CHARGILY_SECRET_KEY");
  const signature = req.headers.get("signature") ?? "";
  const raw = await req.text();

  // Vérification de signature (HMAC-SHA256 du corps brut avec la clé secrète)
  if (CHARGILY_KEY) {
    const valid = await verify(raw, signature, CHARGILY_KEY);
    if (!valid) return new Response("signature invalide", { status: 401 });
  }

  let event: any;
  try {
    event = JSON.parse(raw);
  } catch {
    return new Response("bad json", { status: 400 });
  }

  if (event?.type === "checkout.paid") {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const checkoutId = event.data?.id as string | undefined;
    const meta = Array.isArray(event.data?.metadata) ? event.data.metadata[0] : event.data?.metadata;

    // 1) Paiement de quota (packs)
    let pq = admin.from("payments").select("*").eq("status", "pending");
    pq = checkoutId ? pq.eq("checkout_id", checkoutId) : pq.eq("id", meta?.payment_id);
    const { data: payment } = await pq.maybeSingle();
    if (payment) {
      await admin.from("payments").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", payment.id);
      await admin.rpc("credit_company_quota", {
        p_company_id: payment.company_id,
        p_type: payment.quota_type,
        p_amount: payment.quota_amount,
      });
      return new Response("ok", { status: 200 });
    }

    // 2) Financement d'un séquestre (escrow influenceur)
    let eq = admin.from("escrows").select("id").eq("status", "pending");
    eq = checkoutId ? eq.eq("checkout_id", checkoutId) : eq.eq("id", meta?.escrow_id);
    const { data: escrow } = await eq.maybeSingle();
    if (escrow) {
      await admin.rpc("fund_escrow", { p_escrow_id: escrow.id });
    }
  }

  return new Response("ok", { status: 200 });
});

async function verify(payload: string, signature: string, secret: string): Promise<boolean> {
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
    const hex = [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
    return hex === signature;
  } catch {
    return false;
  }
}
