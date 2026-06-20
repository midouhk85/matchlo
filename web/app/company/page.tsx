"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/useAuth";
import { RoleGate, TopBar, StatCard, Card, Button, Pill } from "@/components/ui";

const DELIVERABLES = ["Post", "Story", "Reel", "Vidéo", "Live"];

export default function CompanyPage() {
  return <RoleGate role="company">{() => <CompanyDashboard />}</RoleGate>;
}

function CompanyDashboard() {
  const { profile } = useAuth();
  const [company, setCompany] = useState<any>(null);
  const [missions, setMissions] = useState<any[]>([]);
  const [engagements, setEngagements] = useState<any[]>([]);
  const [escrows, setEscrows] = useState<Record<string, any>>({});
  const [escrowBusy, setEscrowBusy] = useState<string | null>(null);
  const [escrowDemo, setEscrowDemo] = useState<{ id: string; amount: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    if (!profile) return;
    const { data: c } = await supabase.from("company_profiles").select("*").eq("profile_id", profile.id).maybeSingle();
    setCompany(c);
    const { data: m } = await supabase
      .from("missions")
      .select("*")
      .eq("company_id", profile.id)
      .order("created_at", { ascending: false });
    setMissions(m ?? []);
    const { data: e } = await supabase
      .from("engagements")
      .select("*, match:matches!inner(company_id, mission:missions(title, mission_type), talent:profiles!matches_talent_id_fkey(full_name))")
      .eq("match.company_id", profile.id)
      .order("created_at", { ascending: false });
    setEngagements(e ?? []);
    const { data: esc } = await supabase.from("escrows").select("*").eq("company_id", profile.id);
    setEscrows(Object.fromEntries((esc ?? []).map((x: any) => [x.engagement_id, x])));
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    load();
  }, [load]);

  async function fundEscrow(engagementId: string) {
    setEscrowBusy(engagementId);
    setEscrowDemo(null);
    try {
      const { data, error } = await supabase.functions.invoke("escrow-checkout", { body: { engagementId } });
      if (error) throw error;
      if (data?.checkout_url) window.location.href = data.checkout_url;
      else if (data?.demo) setEscrowDemo({ id: data.escrow_id, amount: data.amount });
      else load();
    } finally {
      setEscrowBusy(null);
    }
  }
  async function simulateEscrow() {
    if (!escrowDemo) return;
    setEscrowBusy("sim");
    await supabase.rpc("dev_confirm_escrow", { p_escrow_id: escrowDemo.id });
    setEscrowDemo(null);
    setEscrowBusy(null);
    load();
  }

  const matchableMissions = missions.length;

  return (
    <div>
      <TopBar title="Espace entreprise" role="company" />
      <div className="max-w-6xl mx-auto px-5 py-8 flex flex-col gap-8">
        {!profile?.is_verified && (
          <div className="bg-warning/15 border border-warning/40 rounded-card p-4 text-sm">
            <span className="font-semibold text-warning">Vérification requise.</span>{" "}
            <span className="text-muted">
              Votre entreprise est {profile?.verification_status === "rejected" ? "rejetée" : "en attente de vérification"} (RC/NIF).
              La publication d&apos;annonces est débloquée une fois votre entreprise vérifiée par l&apos;administration.
            </span>
          </div>
        )}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Annonces" value={matchableMissions} />
          <StatCard label="Missions en cours" value={engagements.length} />
          <StatCard label="Quota urgences" value={company?.urgent_quota ?? 0} />
          <StatCard label="Quota messages directs" value={company?.direct_message_quota ?? 0} />
        </section>

        {/* Annonces */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg">Mes annonces</h2>
            {profile?.is_verified && (
              <Button onClick={() => setShowForm((s) => !s)}>{showForm ? "Fermer" : "＋ Nouvelle annonce"}</Button>
            )}
          </div>

          {showForm && profile?.is_verified && (
            <CreateMission companyId={profile.id} onCreated={() => { setShowForm(false); load(); }} />
          )}

          {loading ? (
            <p className="text-muted">Chargement…</p>
          ) : missions.length === 0 ? (
            <p className="text-muted text-sm">Aucune annonce.</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {missions.map((m) => (
                <Card key={m.id} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{m.title}</span>
                    <Pill color={m.mission_type === "influencer" ? "secondary" : "primary"}>
                      {m.mission_type === "influencer" ? "Influenceur" : "Présentiel"}
                    </Pill>
                  </div>
                  <div className="text-muted text-sm flex gap-4 flex-wrap">
                    <span>📍 {m.wilaya ?? "À distance"}</span>
                    <span>💰 {(m.pay_dzd ?? 0).toLocaleString("fr-DZ")} DA</span>
                    <span>• {m.status}</span>
                    {m.is_urgent && <Pill color="danger">urgent</Pill>}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Missions / engagements */}
        <section className="flex flex-col gap-3">
          <h2 className="font-bold text-lg">Suivi des missions</h2>

          {escrowDemo && (
            <div className="bg-warning/15 border border-warning/40 rounded-card p-4 flex items-center justify-between gap-3">
              <span className="text-sm">
                Mode démo — séquestre de {escrowDemo.amount.toLocaleString("fr-DZ")} DA. Simuler le dépôt ?
              </span>
              <Button variant="success" onClick={simulateEscrow} disabled={escrowBusy === "sim"}>
                {escrowBusy === "sim" ? "…" : "Simuler le dépôt"}
              </Button>
            </div>
          )}

          {engagements.length === 0 ? (
            <p className="text-muted text-sm">Aucune mission engagée.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {engagements.map((e) => {
                const esc = escrows[e.id];
                const isInfluencer = e.match?.mission?.mission_type === "influencer";
                const canFund = isInfluencer && e.status === "awaiting_payment" && (!esc || esc.status === "pending");
                return (
                  <Card key={e.id} className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold">{e.match?.mission?.title}</div>
                      <div className="text-muted text-sm">{e.match?.talent?.full_name}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {esc?.status === "funded" && <Pill color="secondary">🔒 séquestre financé</Pill>}
                      {esc?.status === "released" && <Pill color="success">séquestre libéré</Pill>}
                      {canFund && (
                        <Button onClick={() => fundEscrow(e.id)} disabled={escrowBusy === e.id}>
                          {escrowBusy === e.id ? "…" : "🔒 Sécuriser le paiement"}
                        </Button>
                      )}
                      <Pill color={e.status === "completed" ? "success" : e.status === "disputed" ? "danger" : "primary"}>
                        {e.status}
                      </Pill>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Quotas — rechargeables sur le web (Chargily), §6.1 : aucune vente côté mobile */}
        <section>
          <Card className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-sm text-muted">
              Rechargez vos annonces urgentes et contacts directs (paiement Chargily). L&apos;app
              mobile reste gratuite.
            </span>
            <Button href="/company/billing">💳 Recharger mes quotas</Button>
          </Card>
        </section>
      </div>
    </div>
  );
}

function CreateMission({ companyId, onCreated }: { companyId: string; onCreated: () => void }) {
  const [type, setType] = useState<"onsite" | "influencer">("influencer");
  const [title, setTitle] = useState("");
  const [wilaya, setWilaya] = useState("");
  const [pay, setPay] = useState("");
  const [brief, setBrief] = useState("");
  const [deliverables, setDeliverables] = useState<string[]>([]);
  const [deadline, setDeadline] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [saving, setSaving] = useState(false);

  const valid = type === "onsite" ? title && wilaya && pay : title && brief && deliverables.length && pay;

  async function save() {
    setSaving(true);
    const base = { company_id: companyId, title: title.trim(), pay_dzd: pay ? parseInt(pay) : null, status: "active" };
    const payload =
      type === "onsite"
        ? { ...base, mission_type: "onsite", wilaya, is_urgent: urgent }
        : {
            ...base,
            mission_type: "influencer",
            end_date: deadline || null,
            positions: 1,
            required_profile: { brief: brief.trim(), deliverables },
          };
    await supabase.from("missions").insert(payload as never);
    setSaving(false);
    onCreated();
  }

  const input = "h-11 px-4 rounded-[14px] bg-surfacealt border border-edge text-fg outline-none focus:border-primary";

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex gap-2">
        {(["influencer", "onsite"] as const).map((tt) => (
          <button
            key={tt}
            onClick={() => setType(tt)}
            className={`h-10 px-4 rounded-[14px] text-sm font-medium border ${type === tt ? "bg-primary border-primary" : "bg-surfacealt border-edge text-muted"}`}
          >
            {tt === "influencer" ? "📸 Influenceur" : "📍 Présentiel"}
          </button>
        ))}
      </div>
      <input className={input} placeholder="Titre de l'annonce" value={title} onChange={(e) => setTitle(e.target.value)} />
      {type === "onsite" ? (
        <div className="flex gap-3 flex-wrap">
          <input className={input + " flex-1"} placeholder="Wilaya" value={wilaya} onChange={(e) => setWilaya(e.target.value)} />
          <input className={input + " flex-1"} placeholder="Rémunération (DZD)" value={pay} onChange={(e) => setPay(e.target.value)} />
          <label className="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} /> Urgent
          </label>
        </div>
      ) : (
        <>
          <textarea
            className="px-4 py-3 rounded-[14px] bg-surfacealt border border-edge text-fg outline-none focus:border-primary min-h-[80px]"
            placeholder="Brief de campagne…"
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
          />
          <div className="flex gap-2 flex-wrap">
            {DELIVERABLES.map((d) => (
              <button
                key={d}
                onClick={() => setDeliverables((p) => (p.includes(d) ? p.filter((x) => x !== d) : [...p, d]))}
                className={`h-8 px-3 rounded-full text-xs border ${deliverables.includes(d) ? "bg-primary border-primary" : "bg-surfacealt border-edge text-muted"}`}
              >
                {d}
              </button>
            ))}
          </div>
          <div className="flex gap-3 flex-wrap">
            <input className={input + " flex-1"} placeholder="Date limite (AAAA-MM-JJ)" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            <input className={input + " flex-1"} placeholder="Tarif par post (DZD)" value={pay} onChange={(e) => setPay(e.target.value)} />
          </div>
        </>
      )}
      <Button disabled={!valid || saving} onClick={save}>
        {saving ? "Enregistrement…" : "Publier l'annonce"}
      </Button>
    </Card>
  );
}
