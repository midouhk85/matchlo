// Edge Function : crée une intention de paiement + un checkout Chargily Pay v2.
// Si CHARGILY_SECRET_KEY n'est pas configurée → mode DÉMO (retourne payment_id à
// confirmer via dev_confirm_payment, sans paiement réel).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Packs de quotas — source de vérité côté serveur (prix non manipulables par le client).
const PACKS: Record<string, { id: string; quota_type: "urgent" | "direct_message"; quota_amount: number; amount_dzd: number }> = {
  urgent_5: { id: "urgent_5", quota_type: "urgent", quota_amount: 5, amount_dzd: 2500 },
  urgent_20: { id: "urgent_20", quota_type: "urgent", quota_amount: 20, amount_dzd: 8000 },
  dm_10: { id: "dm_10", quota_type: "direct_message", quota_amount: 10, amount_dzd: 1500 },
  dm_50: { id: "dm_50", quota_type: "direct_message", quota_amount: 50, amount_dzd: 6000 },
};

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { packId } = await req.json();
    const pack = PACKS[packId];
    if (!pack) return json({ error: "pack inconnu" }, 400);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const CHARGILY_KEY = Deno.env.get("CHARGILY_SECRET_KEY");
    const WEB_BASE = Deno.env.get("WEB_BASE_URL") ?? "http://localhost:3000";

    // Identité de l'appelant (JWT transmis par le navigateur)
    const authClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: req.headers.get("Authorization")! } },
    });
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return json({ error: "non authentifié" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // L'appelant doit être une entreprise
    const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "company") return json({ error: "réservé aux entreprises" }, 403);

    // Crée l'intention de paiement (pending)
    const { data: payment, error: pErr } = await admin
      .from("payments")
      .insert({
        company_id: user.id,
        pack: pack.id,
        quota_type: pack.quota_type,
        quota_amount: pack.quota_amount,
        amount_dzd: pack.amount_dzd,
      })
      .select()
      .single();
    if (pErr) return json({ error: pErr.message }, 500);

    // Pas de clé Chargily → mode démo
    if (!CHARGILY_KEY) {
      return json({ demo: true, payment_id: payment.id, pack });
    }

    // Crée le checkout Chargily Pay v2
    const res = await fetch("https://pay.chargily.net/api/v2/checkouts", {
      method: "POST",
      headers: { Authorization: `Bearer ${CHARGILY_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: pack.amount_dzd,
        currency: "dzd",
        success_url: `${WEB_BASE}/company/billing?status=success`,
        failure_url: `${WEB_BASE}/company/billing?status=failed`,
        webhook_endpoint: `${SUPABASE_URL}/functions/v1/chargily-webhook`,
        metadata: [{ payment_id: payment.id }],
      }),
    });
    const checkout = await res.json();
    if (!res.ok) return json({ error: checkout?.message ?? "Chargily error" }, 502);

    await admin.from("payments").update({ checkout_id: checkout.id }).eq("id", payment.id);
    return json({ checkout_url: checkout.checkout_url, payment_id: payment.id });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }

  function json(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
      status,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
