# Matchlo — Web (Next.js)

App web de la **Phase 2**, sur le **même Supabase** que l'app mobile (mêmes
tables, mêmes RLS). Couvre les 4 surfaces du cahier (§3.1) :

- **Landing publique** (`/`) — présentation + badges App Store / Google Play.
- **Connexion** (`/login`) — e-mail + mot de passe, redirection selon le rôle.
- **Console admin** (`/admin`, rôle `admin`) — statistiques + files de modération :
  **missions influenceur** (feu vert 1 : approuver/rejeter → ouvre le chat),
  **vérifications d'identité** (approuver → badge bleu), **signalements**.
- **Dashboard entreprise** (`/company`, rôle `company`) — annonces (création
  présentiel/influenceur), suivi des missions, quotas (lecture).
- **Espace talent** (`/talent`, rôle `talent`) — profil + **bandeau d'incitation
  à installer l'app** (push-to-install, §4 / §4.1).

## Stack
Next.js 16 (App Router) · React 19 · Tailwind CSS v4 (tokens de charte dans
`app/globals.css`) · `@supabase/supabase-js` (auth navigateur).

## Démarrage

```bash
cd web
npm install
cp .env.example .env.local   # puis renseigner les clés Supabase
npm run dev                  # http://localhost:3000
```

`.env.local` :
```
NEXT_PUBLIC_SUPABASE_URL=https://VOTRE-PROJET.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxx
```

## Comptes de démo (mot de passe `matchlo123`)
- `admin@matchlo.app` → console admin
- `test2@matchlo.app` → espace entreprise
- `inf@matchlo.app` / `test1@matchlo.app` → espace talent

## Monétisation (Chargily Pay) — Phase 4
Le paiement se fait **uniquement sur le web** (l'app mobile reste gratuite, §6.1).
Deux Edge Functions Supabase gèrent le flux : `chargily-checkout` (crée le checkout)
et `chargily-webhook` (crédite les quotas après paiement).

Pour activer le vrai paiement, définir les secrets côté Supabase :
```bash
supabase secrets set CHARGILY_SECRET_KEY=live_xxx WEB_BASE_URL=https://votre-domaine.com
```
Sans `CHARGILY_SECRET_KEY`, la page `/company/billing` fonctionne en **mode démo**
(bouton « Simuler le paiement » → crédite les quotas via `dev_confirm_payment`,
fonction à retirer en production). Webhook à enregistrer dans le dashboard Chargily :
`https://<projet>.supabase.co/functions/v1/chargily-webhook`.

### Escrow influenceur (Phase 5)
La fonction `escrow-checkout` dépose le montant d'une mission influenceur sous
séquestre ; le webhook (`fund_escrow`) débloque l'engagement (`in_progress`) ; un
trigger libère automatiquement le séquestre à la clôture (`completed`). En mode démo,
le dépôt se simule via `dev_confirm_escrow` (⚠️ à retirer en production, comme
`dev_confirm_payment`). La console admin agrège revenus, volume de séquestre et taux
de complétion (section Analytics).

## Build
```bash
npm run build && npm start
```

Déploiement recommandé : Vercel (variables d'env = les deux `NEXT_PUBLIC_*`).
