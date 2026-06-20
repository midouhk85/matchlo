"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button, Logo } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function routeByRole(userId: string) {
    const { data } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
    const role = (data as { role?: string } | null)?.role;
    if (role === "admin") router.replace("/admin");
    else if (role === "company") router.replace("/company");
    else router.replace("/talent");
  }

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    if (data.user) routeByRole(data.user.id);
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-5">
      <form onSubmit={signIn} className="w-full max-w-sm flex flex-col gap-5">
        <div className="flex flex-col items-center gap-3 mb-2">
          <Logo size={64} />
          <h1 className="text-2xl font-bold">Connexion</h1>
          <p className="text-muted text-sm text-center">Espace talent · entreprise · admin</p>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-muted text-sm">Adresse email</span>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@exemple.com"
            className="h-11 px-4 rounded-[14px] bg-surfacealt border border-edge text-fg outline-none focus:border-primary"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-muted text-sm">Mot de passe</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="h-11 px-4 rounded-[14px] bg-surfacealt border border-edge text-fg outline-none focus:border-primary"
          />
        </label>

        {error && <p className="text-danger text-sm">{error}</p>}

        <Button type="submit" disabled={loading || !email || password.length < 6} className="h-11">
          {loading ? "Connexion…" : "Se connecter"}
        </Button>

        <p className="text-center text-muted text-xs">
          Comptes de démo : admin@matchlo.app · test2@matchlo.app · inf@matchlo.app — mot de passe{" "}
          <span className="text-fg">matchlo123</span>
        </p>
      </form>
    </main>
  );
}
