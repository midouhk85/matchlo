"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/useAuth";
import { RoleGate, TopBar, Card, Button, Pill, VerifiedBadge, InstallBanner } from "@/components/ui";

export default function TalentPage() {
  return <RoleGate role="talent">{() => <TalentSpace />}</RoleGate>;
}

function TalentSpace() {
  const { profile, refresh } = useAuth();
  const [details, setDetails] = useState<any>(null);
  const [fullName, setFullName] = useState("");
  const [wilaya, setWilaya] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    if (!profile) return;
    setFullName(profile.full_name ?? "");
    setWilaya(profile.wilaya ?? "");
    const { data } = await supabase.from("talent_profiles").select("*").eq("profile_id", profile.id).maybeSingle();
    setDetails(data);
    setBio((data as { bio?: string } | null)?.bio ?? "");
  }, [profile]);

  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    if (!profile) return;
    setSaving(true);
    await supabase.from("profiles").update({ full_name: fullName.trim(), wilaya }).eq("id", profile.id);
    await supabase.from("talent_profiles").update({ bio: bio || null }).eq("profile_id", profile.id);
    await refresh();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const input = "h-11 px-4 rounded-[14px] bg-surfacealt border border-edge text-fg outline-none focus:border-primary w-full";

  return (
    <div>
      <TopBar title="Espace talent" role="talent" />
      <div className="max-w-3xl mx-auto px-5 py-8 flex flex-col gap-6">
        {/* Bandeau d'incitation à installer l'app (§4) */}
        <InstallBanner />

        <Card className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-full bg-cover bg-center shrink-0"
            style={{ background: profile?.photo_url ? `url(${profile.photo_url}) center/cover` : "linear-gradient(135deg,#7C5CFF,#3B7BF6)" }}
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg">{profile?.full_name}</span>
              {profile?.is_verified && <VerifiedBadge size={18} />}
            </div>
            <div className="text-muted text-sm">📍 {profile?.wilaya ?? "—"}</div>
          </div>
          <Pill color={details?.talent_type === "influencer" ? "secondary" : "primary"}>
            {details?.talent_type === "influencer" ? "Influenceur" : "Hôte/hôtesse"}
          </Pill>
        </Card>

        {/* Édition de profil */}
        <Card className="flex flex-col gap-3">
          <h2 className="font-bold">Modifier mon profil</h2>
          <input className={input} placeholder="Nom complet" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <input className={input} placeholder="Wilaya" value={wilaya} onChange={(e) => setWilaya(e.target.value)} />
          <textarea
            className="px-4 py-3 rounded-[14px] bg-surfacealt border border-edge text-fg outline-none focus:border-primary min-h-[90px]"
            placeholder="Bio…"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
          <div className="flex items-center gap-3">
            <Button onClick={save} disabled={saving}>
              {saving ? "Enregistrement…" : "Enregistrer"}
            </Button>
            {saved && <span className="text-success text-sm">✓ Enregistré</span>}
          </div>
        </Card>

        {/* Asymétrie de capacités : ces actions sont sur l'app (§4.1 levier A) */}
        <Card className="flex flex-col gap-2">
          <h2 className="font-bold">Vos missions</h2>
          <p className="text-muted text-sm">
            Accepter une mission, discuter en temps réel et confirmer votre présence par QR se font
            sur l&apos;app mobile.
          </p>
          <div className="flex items-center gap-3 mt-1">
            <Pill color="secondary">Disponible sur l&apos;app</Pill>
            <Button href="/" variant="outline" className="h-9">
              Obtenir l&apos;app
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
