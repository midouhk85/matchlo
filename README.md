# Matchlo — Application mobile (Phase 1 / MVP)

Marketplace mobile à deux faces (style swipe/match) qui met en relation des
**talents** (hôtes/hôtesses, et plus tard influenceurs) et des **entreprises** en
Algérie. Mobile-first (Expo / React Native), backend **Supabase** partagé.

> Ce dépôt contient la **Phase 1 (MVP)**. Les phases 2 à 5 (influenceur + web
> Next.js, confiance/réputation, monétisation, escrow) sont décrites dans le
> cahier des charges et les prompts de démarrage.

---

## ✅ Périmètre Phase 1 livré

- **Auth e-mail → OTP (6 chiffres)** via Supabase Auth, puis **choix du rôle**
  (talent / entreprise).
- **Onboarding hôte/hôtesse** en 3 étapes (photos, infos, profil pro) +
  **onboarding entreprise** (logo, raison sociale, secteur, RC, NIF).
- **Capture de la position** (lat/lng) via `expo-location`, repli saisie wilaya.
- **Decks de swipe dans les deux sens** (talent → annonces, entreprise → profils)
  avec **filtres wilaya + rayon (km)**, gestes + animations.
- **`process_swipe`** côté serveur (RPC `security definer`) : détection de
  réciprocité, création de **match**, `moderation_status`
  (`not_required` onsite / `pending_admin` influenceur).
- **Chat temps réel** (Supabase Realtime), conditionné par le **gate de
  modération** (RLS).
- **Détail de mission** (vue talent) + **profils** talent/entreprise.
- **i18n FR / AR (RTL) / EN**, thème sombre + variantes claires, tokens
  `tailwind.config.js` (NativeWind v4).

---

## 🧱 Stack

| Domaine | Choix |
|---|---|
| Mobile | Expo (React Native + TypeScript), **Expo Router** |
| Styles | **NativeWind v4** (+ `tailwind.config.js` = source de vérité des tokens) |
| Backend | **Supabase** : Auth (OTP), Postgres + **RLS**, Storage, Realtime, RPC |
| État / data | **Zustand** (UI) + **TanStack Query** (cache serveur) |
| i18n | `i18next` / `react-i18next` + `expo-localization` |
| Divers | `expo-linear-gradient`, `expo-location`, `expo-image-picker`, `react-native-reanimated`, `react-native-gesture-handler` |

---

## 🚀 Démarrage

### 1. Prérequis
- Node ≥ 20, npm
- L'app **Expo Go** sur votre téléphone (iOS/Android), ou un simulateur.

### 2. Installation

```bash
npm install --legacy-peer-deps
```

> `--legacy-peer-deps` est nécessaire à cause d'un conflit de peer dependency
> `react` / `react-dom` introduit par les dépendances web d'`expo-router`.

### 3. Variables d'environnement

Copiez `.env.example` en `.env` et renseignez les clés Supabase :

```bash
EXPO_PUBLIC_SUPABASE_URL=https://VOTRE-PROJET.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxx   # ou la clé anon (JWT)
```

Le projet est déjà connecté au Supabase **« Matchlo »**
(`tscshavqpauzjtlvavvt`, organisation *Benyelles's Org*, région `eu-central-1`).

### 4. Lancer

```bash
npm start            # puis scanner le QR avec Expo Go
npm run ios          # simulateur iOS
npm run android      # émulateur Android
```

---

## 🔐 Configuration Supabase (à vérifier une fois)

1. **Auth → Providers → Email** : activé.
2. **OTP 6 chiffres** : dans *Auth → Email Templates → Magic Link*, assurez-vous
   que le template contient le **jeton** `{{ .Token }}` (sinon Supabase n'envoie
   qu'un lien magique et le champ de code OTP reste inutilisable).
3. La base est déjà migrée (voir `supabase/migrations/`) : extensions
   `cube` + `earthdistance`, tous les enums/tables du §7, **RLS** du §7.1,
   `process_swipe`, decks `get_talent_deck` / `get_company_deck`, buckets
   Storage (`photos`, `logos` publics ; `documents` privé) et un **seed de
   démonstration** (entreprises vérifiées + annonces + talents hôtes).

> Les migrations sont fournies à titre de référence dans `supabase/migrations/`.
> Elles ont déjà été appliquées au projet hébergé.

---

## 🗂️ Structure

```
app/
  _layout.tsx          # providers, polices, i18n, garde d'authentification
  index.tsx            # redirection initiale
  (auth)/              # login, otp, role
  onboarding/          # talent-type, host, company
  (talent)/            # onglets: discover, matches, missions, profile
  (company)/           # onglets: candidates, matches, ads, profile
  chat/[matchId].tsx   # chat temps réel (thème clair)
  mission/[id].tsx     # détail de mission (thème clair)
components/            # UI (ui.tsx), SwipeDeck, cards, modales, Picker…
lib/                   # supabase, api (RPC), i18n, location, upload, types
store/                 # useSession (Zustand)
constants/             # données de référence (wilayas, langues…), couleurs
supabase/migrations/   # SQL de référence (schéma + RLS + RPC + seed)
```

---

## 📦 Déploiement EAS (build natif)

Les identifiants sont **figés** : slug `matchlo`, bundle iOS/Android
`com.matchlo.app`.

```bash
npm i -g eas-cli
eas login
eas build:configure
eas build --platform android --profile preview
eas build --platform ios --profile preview
```

Pensez à définir les variables `EXPO_PUBLIC_SUPABASE_URL` /
`EXPO_PUBLIC_SUPABASE_ANON_KEY` comme secrets EAS.

---

## 🧭 Suite (prochaines phases)

- **Phase 2** : sous-type influenceur, gate de modération admin (double feu
  vert), app web Next.js (landing + espace talent + dashboard entreprise +
  console admin).
- **Phase 3** : vérification d'identité/entreprise, évaluations
  bidirectionnelles, QR de présence + check-in, signalement.
- **Phase 4** : monétisation (Chargily, web only), quotas, annonces urgentes.
- **Phase 5** : escrow influenceur, algorithme de classement, analytics.

Voir `cahier-des-charges-matchlo.md` et `prompt-claude-code-matchlo-phaseN.md`.
