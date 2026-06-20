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

## Build
```bash
npm run build && npm start
```

Déploiement recommandé : Vercel (variables d'env = les deux `NEXT_PUBLIC_*`).
