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

        {loading ? (
          <p className="text-muted">Chargement…</p>
        ) : (
          <>
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
