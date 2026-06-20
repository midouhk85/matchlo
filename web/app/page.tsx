import { Button, StoreBadges, Logo } from "@/components/ui";

export default function Landing() {
  return (
    <main className="min-h-screen">
      <nav className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Logo size={32} />
          <span className="font-bold text-lg">Matchlo</span>
        </div>
        <Button href="/login" variant="outline" className="h-10">
          Se connecter
        </Button>
      </nav>

      <section className="max-w-6xl mx-auto px-5 pt-16 pb-20 grid lg:grid-cols-2 gap-12 items-center">
        <div className="flex flex-col gap-6">
          <span className="inline-flex w-fit items-center gap-2 px-3 h-7 rounded-full bg-secondary/20 text-secondary text-xs font-medium">
            Marketplace mobile · Algérie
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
            Talents et entreprises, <span className="text-primary">le bon match.</span>
          </h1>
          <p className="text-muted text-lg max-w-md">
            Hôtes, hôtesses et influenceurs rencontrent les marques par swipe. Match mutuel, chat
            in-app, missions près de chez vous.
          </p>
          <div className="flex flex-col gap-4">
            <StoreBadges />
            <div className="flex gap-3">
              <Button href="/login">Créer mon profil</Button>
              <Button href="/login" variant="outline">
                Espace entreprise
              </Button>
            </div>
          </div>
        </div>

        <div className="justify-self-center">
          <div className="w-[260px] rounded-[34px] border border-edge bg-bg p-3 shadow-2xl">
            <div className="rounded-[26px] overflow-hidden">
              <div
                className="h-[460px] p-5 flex flex-col justify-end"
                style={{ background: "linear-gradient(135deg,#7C5CFF,#E96FE3)" }}
              >
                <span className="w-fit px-2 h-6 rounded-full bg-white/20 text-white text-[11px] flex items-center">
                  📸 Influenceur
                </span>
                <div className="flex-1" />
                <div className="text-white text-2xl font-bold">Campagne mode été</div>
                <div className="text-white/80 text-sm">Brand Agency DZ</div>
                <div className="flex gap-2 mt-3">
                  <span className="bg-black/25 text-white text-[11px] px-3 h-7 rounded-full flex items-center">
                    👥 45 k
                  </span>
                  <span className="bg-black/25 text-white text-[11px] px-3 h-7 rounded-full flex items-center">
                    💰 12 000 DA / post
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-5 pb-20 grid sm:grid-cols-3 gap-5">
        {[
          { e: "🙋‍♀️", t: "Hôtes / hôtesses", d: "Missions présentielles : salons, conférences, concerts. Paiement cash sur place." },
          { e: "📸", t: "Influenceurs", d: "Campagnes à distance : posts, stories, reels. Mission sécurisée par validation." },
          { e: "🏢", t: "Entreprises", d: "Publiez des annonces, swipez les profils, gérez vos missions et vos quotas." },
        ].map((c) => (
          <div key={c.t} className="bg-surface border border-edge rounded-card p-6">
            <div className="text-3xl">{c.e}</div>
            <h3 className="font-semibold text-lg mt-3">{c.t}</h3>
            <p className="text-muted text-sm mt-1">{c.d}</p>
          </div>
        ))}
      </section>

      <section className="max-w-6xl mx-auto px-5 pb-20">
        <div className="bg-surface border border-edge rounded-card p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold">L&apos;app mobile, pour décrocher vos missions vite.</h2>
            <p className="text-muted mt-2 max-w-lg">
              Notifications en temps réel, acceptation en un geste, chat et QR de présence —
              l&apos;expérience complète est sur l&apos;app.
            </p>
          </div>
          <StoreBadges />
        </div>
      </section>

      <footer className="border-t border-edge">
        <div className="max-w-6xl mx-auto px-5 py-8 text-muted text-sm flex items-center justify-between">
          <span>© {new Date().getFullYear()} Matchlo</span>
          <span>Fait en Algérie 🇩🇿</span>
        </div>
      </footer>
    </main>
  );
}
