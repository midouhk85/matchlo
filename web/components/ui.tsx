"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/useAuth";

/* ── Primitives ── */
export function Button({
  children,
  onClick,
  href,
  variant = "primary",
  disabled,
  className = "",
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: "primary" | "secondary" | "success" | "danger" | "outline";
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
}) {
  const styles: Record<string, string> = {
    primary: "bg-primary text-fg hover:opacity-90",
    secondary: "bg-secondary text-fg hover:opacity-90",
    success: "bg-success text-fg hover:opacity-90",
    danger: "bg-danger text-fg hover:opacity-90",
    outline: "border border-edge text-fg hover:bg-surfacealt",
  };
  const cls = `inline-flex items-center justify-center gap-2 h-11 px-5 rounded-[14px] font-medium text-sm transition disabled:opacity-50 ${styles[variant]} ${className}`;
  if (href)
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-surface border border-edge rounded-card p-5 ${className}`}>{children}</div>
  );
}

export function Pill({ children, color = "primary" }: { children: React.ReactNode; color?: string }) {
  const map: Record<string, string> = {
    primary: "bg-primary/20 text-primary",
    success: "bg-success/20 text-success",
    warning: "bg-warning/20 text-warning",
    danger: "bg-danger/20 text-danger",
    secondary: "bg-secondary/20 text-secondary",
    muted: "bg-surfacealt text-muted",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-3 h-7 rounded-full text-xs font-medium ${map[color] ?? map.primary}`}>
      {children}
    </span>
  );
}

export function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-surface border border-edge rounded-card p-5">
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-muted text-sm mt-1">{label}</div>
    </div>
  );
}

export function VerifiedBadge({ size = 16 }: { size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-full bg-primary text-fg font-bold"
      style={{ width: size, height: size, fontSize: size * 0.62 }}
    >
      ✓
    </span>
  );
}

/* ── Garde de rôle pour les espaces protégés ── */
export function RoleGate({
  role,
  children,
}: {
  role: "admin" | "company" | "talent";
  children: (ctx: { profile: NonNullable<ReturnType<typeof useAuth>["profile"]> }) => React.ReactNode;
}) {
  const { session, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!session) router.replace(`/login?next=${role}`);
    else if (profile && profile.role !== role) router.replace(`/${profile.role}`);
  }, [loading, session, profile, role, router]);

  if (loading || !session || !profile) {
    return <div className="min-h-screen flex items-center justify-center text-muted">Chargement…</div>;
  }
  if (profile.role !== role) return null;
  return <>{children({ profile })}</>;
}

/* ── En-tête des espaces ── */
export function TopBar({ title, role }: { title: string; role: string }) {
  const { signOut } = useAuth();
  const router = useRouter();
  return (
    <header className="sticky top-0 z-10 bg-bg/90 backdrop-blur border-b border-edge">
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo size={28} />
          <span className="font-bold">Matchlo</span>
          <Pill color="muted">{title}</Pill>
        </div>
        <button
          onClick={async () => {
            await signOut();
            router.replace("/login");
          }}
          className="text-muted text-sm hover:text-fg"
        >
          Se déconnecter
        </button>
      </div>
    </header>
  );
}

export function Logo({ size = 40 }: { size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-[12px]"
      style={{ width: size, height: size, background: "linear-gradient(135deg,#7C5CFF,#3B7BF6)", fontSize: size * 0.5 }}
    >
      💫
    </span>
  );
}

/* ── Badges stores (push-to-install) ── */
export function StoreBadges() {
  return (
    <div className="flex flex-wrap gap-3">
      <span className="inline-flex items-center gap-2 h-12 px-4 rounded-[12px] bg-black border border-edge text-fg">
        <span style={{ fontSize: 22 }}></span>
        <span className="text-left leading-tight">
          <span className="block text-[10px] text-muted">Télécharger sur</span>
          <span className="block text-sm font-semibold">App Store</span>
        </span>
      </span>
      <span className="inline-flex items-center gap-2 h-12 px-4 rounded-[12px] bg-black border border-edge text-fg">
        <span style={{ fontSize: 20 }}>▶</span>
        <span className="text-left leading-tight">
          <span className="block text-[10px] text-muted">Disponible sur</span>
          <span className="block text-sm font-semibold">Google Play</span>
        </span>
      </span>
    </div>
  );
}

/* ── Bandeau d'incitation à installer l'app (espace talent web, §4) ── */
export function InstallBanner() {
  return (
    <div className="bg-secondary/15 border border-secondary/40 rounded-card p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
      <div className="text-sm">
        <span className="font-semibold">📱 Installez l&apos;app Matchlo</span>{" "}
        <span className="text-muted">
          pour recevoir plus d&apos;offres, des notifications en temps réel et accepter les missions où que vous soyez.
        </span>
      </div>
      <StoreBadges />
    </div>
  );
}
