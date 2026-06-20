"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/useAuth";
import { RoleGate, TopBar, StatCard, Card, Button, Pill } from "@/components/ui";

export default function AdminPage() {
  return (
    <RoleGate role="admin">
      {() => <AdminConsole />}
    </RoleGate>
  );
}

function AdminConsole() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<Record<string, number>>({});
  const [missions, setMissions] = useState<any[]>([]);
  const [verifs, setVerifs] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const countOf = async (table: string, filter?: (q: any) => any) => {
      let q = supabase.from(table).select("id", { count: "exact", head: true });
      if (filter) q = filter(q);
      const { count } = await q;
      return count ?? 0;
    };

    const [talents, companies, nbMissions, nbMatches, pendingVerifs, openReports] = await Promise.all([
      countOf("profiles", (q) => q.eq("role", "talent")),
      countOf("profiles", (q) => q.eq("role", "company")),
      countOf("missions"),
      countOf("matches"),
      countOf("verifications", (q) => q.eq("status", "pending")),
      countOf("reports", (q) => q.eq("status", "open")),
    ]);
    setStats({ talents, companies, nbMissions, nbMatches, pendingVerifs, openReports });

    const { data: m } = await supabase
      .from("matches")
      .select("*, mission:missions(title, mission_type, required_profile, pay_dzd, end_date), company:profiles!matches_company_id_fkey(full_name), talent:profiles!matches_talent_id_fkey(full_name)")
      .eq("moderation_status", "pending_admin")
      .order("created_at", { ascending: false });
    setMissions(m ?? []);

    const { data: v } = await supabase
      .from("verifications")
      .select("*, profile:profiles!verifications_profile_id_fkey(full_name, role)")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    setVerifs(v ?? []);

    const { data: r } = await supabase
      .from("reports")
      .select("*")
      .eq("status", "open")
      .order("created_at", { ascending: false });
    setReports(r ?? []);

    const { data: co } = await supabase
      .from("profiles")
      .select("id, full_name, verification_status, company:company_profiles!company_profiles_profile_id_fkey(rc_number, nif, sector)")
      .eq("role", "company")
      .eq("verification_status", "pending")
      .order("created_at", { ascending: false });
    setCompanies(co ?? []);

    // ── Analytics ──
    const [{ data: paid }, { data: esc }, { data: engs }, { data: miss }] = await Promise.all([
      supabase.from("payments").select("amount_dzd").eq("status", "paid"),
      supabase.from("escrows").select("amount_dzd, status"),
      supabase.from("engagements").select("status"),
      supabase.from("missions").select("mission_type"),
    ]);
    const sum = (rows: any[] | null, key: string) => (rows ?? []).reduce((a, r) => a + (r[key] ?? 0), 0);
    const countBy = (rows: any[] | null, key: string) =>
      (rows ?? []).reduce((acc: Record<string, number>, r) => ((acc[r[key]] = (acc[r[key]] ?? 0) + 1), acc), {});
    const engByStatus = countBy(engs, "status");
    const totalEng = (engs ?? []).length;
    setAnalytics({
      revenue: sum(paid, "amount_dzd"),
      escrowVolume: sum((esc ?? []).filter((e: any) => e.status === "funded" || e.status === "released"), "amount_dzd"),
      escrowReleased: sum((esc ?? []).filter((e: any) => e.status === "released"), "amount_dzd"),
      completionRate: totalEng ? Math.round(((engByStatus["completed"] ?? 0) / totalEng) * 100) : 0,
      missionsByType: countBy(miss, "mission_type"),
      engByStatus,
    });

    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function moderateMatch(id: string, status: "approved" | "rejected") {
    await supabase.from("matches").update({ moderation_status: status }).eq("id", id);
    load();
  }
  async function moderateVerif(v: any, status: "verified" | "rejected") {
    await supabase.from("verifications").update({ status, reviewed_by: profile?.id }).eq("id", v.id);
    await supabase
      .from("profiles")
      .update({ verification_status: status, is_verified: status === "verified" })
      .eq("id", v.profile_id);
    load();
  }
  async function resolveReport(id: string, status: "reviewed" | "actioned") {
    await supabase.from("reports").update({ status }).eq("id", id);
    load();
  }
  async function moderateCompany(id: string, status: "verified" | "rejected") {
    await supabase
      .from("profiles")
      .update({ verification_status: status, is_verified: status === "verified" })
      .eq("id", id);
    load();
  }

  return (
    <div>
      <TopBar title="Console admin" role="admin" />
      <div className="max-w-6xl mx-auto px-5 py-8 flex flex-col gap-8">
        {/* Statistiques */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard label="Talents" value={stats.talents ?? 0} />
          <StatCard label="Entreprises" value={stats.companies ?? 0} />
          <StatCard label="Annonces" value={stats.nbMissions ?? 0} />
          <StatCard label="Matchs" value={stats.nbMatches ?? 0} />
          <StatCard label="Vérifs en attente" value={stats.pendingVerifs ?? 0} />
          <StatCard label="Signalements" value={stats.openReports ?? 0} />
        </section>

        {/* Analytics (Phase 5) */}
        {analytics && (
          <section className="flex flex-col gap-4">
            <h2 className="font-bold text-lg">Analytics</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Revenu quotas (DA)" value={analytics.revenue.toLocaleString("fr-DZ")} />
              <StatCard label="Séquestre actif (DA)" value={analytics.escrowVolume.toLocaleString("fr-DZ")} />
              <StatCard label="Séquestre libéré (DA)" value={analytics.escrowReleased.toLocaleString("fr-DZ")} />
              <StatCard label="Taux de complétion" value={`${analytics.completionRate}%`} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Card>
                <div className="font-semibold mb-3">Missions par type</div>
                <Bars data={analytics.missionsByType} labels={{ onsite: "Présentiel", influencer: "Influenceur" }} />
              </Card>
              <Card>
                <div className="font-semibold mb-3">Missions par statut</div>
                <Bars data={analytics.engByStatus} />
              </Card>
            </div>
          </section>
        )}

        {loading ? (
          <p className="text-muted">Chargement…</p>
        ) : (
          <>
            {/* File : vérification des entreprises (RC/NIF) — requise pour publier */}
            <Queue title="Entreprises à vérifier" empty="Aucune entreprise en attente." count={companies.length}>
              {companies.map((c) => (
                <Card key={c.id} className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold">{c.full_name}</div>
                    <div className="text-muted text-sm">
                      {c.company?.sector} · RC {c.company?.rc_number} · NIF {c.company?.nif}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="success" onClick={() => moderateCompany(c.id, "verified")}>
                      Vérifier
                    </Button>
                    <Button variant="outline" onClick={() => moderateCompany(c.id, "rejected")}>
                      Rejeter
                    </Button>
                  </div>
                </Card>
              ))}
            </Queue>

            {/* File : missions influenceur à modérer (feu vert 1) */}
            <Queue title="Missions influenceur à valider" empty="Aucune mission en attente." count={missions.length}>
              {missions.map((m) => (
                <Card key={m.id} className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">{m.mission?.title}</div>
                      <div className="text-muted text-sm">
                        {m.company?.full_name} → {m.talent?.full_name} · 💰 {(m.mission?.pay_dzd ?? 0).toLocaleString("fr-DZ")} DA
                      </div>
                    </div>
                    <Pill color="warning">en attente</Pill>
                  </div>
                  {m.mission?.required_profile?.brief && (
                    <p className="text-muted text-sm bg-surfacealt rounded-[14px] p-3">{m.mission.required_profile.brief}</p>
                  )}
                  <div className="flex gap-3">
                    <Button variant="success" onClick={() => moderateMatch(m.id, "approved")}>
                      Approuver
                    </Button>
                    <Button variant="danger" onClick={() => moderateMatch(m.id, "rejected")}>
                      Rejeter
                    </Button>
                  </div>
                </Card>
              ))}
            </Queue>

            {/* File : vérifications d'identité */}
            <Queue title="Vérifications d'identité" empty="Aucune vérification en attente." count={verifs.length}>
              {verifs.map((v) => (
                <Card key={v.id} className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold">{v.profile?.full_name}</div>
                    <div className="text-muted text-sm">
                      {v.profile?.role} · pièce : <span className="text-fg">{v.doc_url?.split("/").pop()}</span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="success" onClick={() => moderateVerif(v, "verified")}>
                      Approuver
                    </Button>
                    <Button variant="outline" onClick={() => moderateVerif(v, "rejected")}>
                      Rejeter
                    </Button>
                  </div>
                </Card>
              ))}
            </Queue>

            {/* File : signalements */}
            <Queue title="Signalements" empty="Aucun signalement ouvert." count={reports.length}>
              {reports.map((r) => (
                <Card key={r.id} className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold">{r.reason}</div>
                    <div className="text-muted text-sm">{r.details}</div>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => resolveReport(r.id, "reviewed")}>
                      Examiné
                    </Button>
                    <Button variant="danger" onClick={() => resolveReport(r.id, "actioned")}>
                      Action prise
                    </Button>
                  </div>
                </Card>
              ))}
            </Queue>
          </>
        )}
      </div>
    </div>
  );
}

function Bars({ data, labels }: { data: Record<string, number>; labels?: Record<string, string> }) {
  const entries = Object.entries(data ?? {});
  const max = Math.max(1, ...entries.map(([, v]) => v));
  if (entries.length === 0) return <p className="text-muted text-sm">Aucune donnée.</p>;
  return (
    <div className="flex flex-col gap-2">
      {entries.map(([k, v]) => (
        <div key={k} className="flex items-center gap-3">
          <span className="text-muted text-xs w-28 shrink-0 capitalize">{labels?.[k] ?? k}</span>
          <div className="flex-1 h-5 bg-surfacealt rounded-[6px] overflow-hidden">
            <div className="h-full bg-primary rounded-[6px]" style={{ width: `${(v / max) * 100}%` }} />
          </div>
          <span className="text-fg text-sm w-6 text-right">{v}</span>
        </div>
      ))}
    </div>
  );
}

function Queue({
  title,
  count,
  empty,
  children,
}: {
  title: string;
  count: number;
  empty: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-bold text-lg flex items-center gap-2">
        {title} {count > 0 && <Pill color="primary">{count}</Pill>}
      </h2>
      {count === 0 ? <p className="text-muted text-sm">{empty}</p> : <div className="flex flex-col gap-3">{children}</div>}
    </section>
  );
}
