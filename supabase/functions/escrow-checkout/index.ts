// Edge Function : finance un séquestre (escrow) pour une mission influenceur.
// L'entreprise dépose le montant ; il sera libéré au talent à la clôture (completed).
// Mode DÉMO si CHARGILY_SECRET_KEY absente.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { engagementId } = await req.json();
    if (!engagementId) return json({ error: "engagementId requis" }, 400);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const CHARGILY_KEY = Deno.env.get("CHARGILY_SECRET_KEY");
    const WEB_BASE = Deno.env.get("WEB_BASE_URL") ?? "http://localhost:3000";

    const authClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: req.headers.get("Authorization")! } },
    });
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return json({ error: "non authentifié" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Charge l'engagement → match → mission (montant)
    const { data: eng } = await admin
      .from("engagements")
      .select("id, match:matches!inner(company_id, talent_id, mission:missions(pay_dzd))")
      .eq("id", engagementId)
      .single();
    const match: any = eng?.match;
    if (!match || match.company_id !== user.id) return json({ error: "non autorisé" }, 403);

    const amount = match.mission?.pay_dzd ?? 0;
    if (amount < 50) return json({ error: "montant invalide" }, 400);

    // Évite les doublons : réutilise un escrow pending existant
    const { data: existing } = await admin
      .from("escrows").select("*").eq("engagement_id", engagementId).neq("status", "refunded").maybeSingle();
    const escrow = existing ?? (await admin
      .from("escrows")
      .insert({ engagement_id: engagementId, company_id: user.id, talent_id: match.talent_id, amount_dzd: amount })
      .select().single()).data;

    if (!escrow) return json({ error: "escrow non créé" }, 500);
    if (escrow.status === "funded") return json({ already: true });

    if (!CHARGILY_KEY) {
      return json({ demo: true, escrow_id: escrow.id, amount });
    }

    const res = await fetch("https://pay.chargily.net/api/v2/checkouts", {
      method: "POST",
      headers: { Authorization: `Bearer ${CHARGILY_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        amount,
        currency: "dzd",
        success_url: `${WEB_BASE}/company?status=escrow_funded`,
        failure_url: `${WEB_BASE}/company?status=failed`,
        webhook_endpoint: `${SUPABASE_URL}/functions/v1/chargily-webhook`,
        metadata: [{ escrow_id: escrow.id }],
      }),
    });
    const checkout = await res.json();
    if (!res.ok) return json({ error: checkout?.message ?? "Chargily error" }, 502);

    await admin.from("escrows").update({ checkout_id: checkout.id }).eq("id", escrow.id);
    return json({ checkout_url: checkout.checkout_url, escrow_id: escrow.id });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }

  function json(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
