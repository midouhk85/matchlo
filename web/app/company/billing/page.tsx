"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/useAuth";
import { RoleGate, TopBar, Card, Button, Pill, StatCard } from "@/components/ui";
import { PACKS } from "@/lib/packs";

export default function BillingPage() {
  return <RoleGate role="company">{() => <Billing />}</RoleGate>;
}

function Billing() {
  const { profile } = useAuth();
  const [company, setCompany] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [demo, setDemo] = useState<{ paymentId: string; label: string } | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!profile) return;
    const { data: c } = await supabase.from("company_profiles").select("*").eq("profile_id", profile.id).maybeSingle();
    setCompany(c);
    const { data: p } = await supabase
      .from("payments")
      .select("*")
      .eq("company_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(10);
    setPayments(p ?? []);
  }, [profile]);

  useEffect(() => {
    load();
    const status = new URLSearchParams(window.location.search).get("status");
    if (status === "success") setBanner("Paiement confirmé. Vos quotas ont été crédités.");
    if (status === "failed") setBanner("Le paiement a échoué ou a été annulé.");
  }, [load]);

  async function buy(packId: string, label: string) {
    setBusy(packId);
    setDemo(null);
    try {
      const { data, error } = await supabase.functions.invoke("chargily-checkout", { body: { packId } });
      if (error) throw error;
      if (data?.checkout_url) {
        window.location.href = data.checkout_url; // vrai paiement Chargily
      } else if (data?.demo) {
        // Pas de clé Chargily configurée → simulation pour la démo
        setDemo({ paymentId: data.payment_id, label });
      }
    } catch (e: any) {
      setBanner(e.message ?? "Erreur");
    } finally {
      setBusy(null);
    }
  }

  async function simulate() {
    if (!demo) return;
    setBusy("sim");
    await supabase.rpc("dev_confirm_payment", { p_payment_id: demo.paymentId });
    setDemo(null);
    setBusy(null);
    setBanner("Paiement simulé : quotas crédités.");
    load();
  }

  const urgent = PACKS.filter((p) => p.quota_type === "urgent");
  const dm = PACKS.filter((p) => p.quota_type === "direct_message");

  return (
    <div>
      <TopBar title="Facturation" role="company" />
      <div className="max-w-5xl mx-auto px-5 py-8 flex flex-col gap-8">
        {banner && (
          <div className="bg-primary/15 border border-primary/40 rounded-card p-4 text-sm flex items-center justify-between">
            <span>{banner}</span>
            <button onClick={() => setBanner(null)} className="text-muted hover:text-fg">✕</button>
          </div>
        )}

        {/* Soldes */}
        <section className="grid grid-cols-2 gap-4">
          <StatCard label="Annonces urgentes restantes" value={company?.urgent_quota ?? 0} />
          <StatCard label="Contacts directs restants" value={company?.direct_message_quota ?? 0} />
        </section>

        {/* Conformité stores */}
        <div className="bg-surface border border-edge rounded-card p-4 text-sm text-muted">
          💳 Le paiement se fait ici, sur le web (Chargily : CIB, Dahabia, BaridiMob). L&apos;app
          mobile reste entièrement gratuite et ne vend rien — conformément aux règles App Store et
          Google Play.
        </div>

        {/* Mode démo */}
        {demo && (
          <div className="bg-warning/15 border border-warning/40 rounded-card p-4 flex items-center justify-between gap-3">
            <span className="text-sm">
              Mode démo (aucune clé Chargily) — « {demo.label} ». Simuler un paiement réussi ?
            </span>
            <Button variant="success" onClick={simulate} disabled={busy === "sim"}>
              {busy === "sim" ? "…" : "Simuler le paiement"}
            </Button>
          </div>
        )}

        <PackGroup title="Annonces urgentes" packs={urgent} buy={buy} busy={busy} />
        <PackGroup title="Contacts directs (sans match)" packs={dm} buy={buy} busy={busy} />

        {/* Historique */}
        <section className="flex flex-col gap-3">
          <h2 className="font-bold text-lg">Historique des paiements</h2>
          {payments.length === 0 ? (
            <p className="text-muted text-sm">Aucun paiement.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {payments.map((p) => (
                <Card key={p.id} className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{p.pack}</div>
                    <div className="text-muted text-sm">
                      {p.amount_dzd.toLocaleString("fr-DZ")} DA · {new Date(p.created_at).toLocaleDateString("fr-DZ")}
                    </div>
                  </div>
                  <Pill color={p.status === "paid" ? "success" : p.status === "failed" ? "danger" : "warning"}>
                    {p.status}
                  </Pill>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function PackGroup({
  title,
  packs,
  buy,
  busy,
}: {
  title: string;
  packs: typeof PACKS;
  buy: (id: string, label: string) => void;
  busy: string | null;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-bold text-lg">{title}</h2>
      <div className="grid sm:grid-cols-2 gap-3">
        {packs.map((p) => (
          <Card key={p.id} className="flex items-center justify-between">
            <div>
              <div className="font-semibold">{p.label}</div>
              <div className="text-primary text-lg font-bold">{p.amount_dzd.toLocaleString("fr-DZ")} DA</div>
            </div>
            <Button onClick={() => buy(p.id, p.label)} disabled={busy === p.id}>
              {busy === p.id ? "…" : "Acheter"}
            </Button>
          </Card>
        ))}
      </div>
    </section>
  );
}
