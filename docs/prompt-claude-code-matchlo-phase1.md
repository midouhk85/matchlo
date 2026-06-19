# PROMPT DE DÉMARRAGE — CLAUDE CODE · MATCHLO (Phase 1)

> Avant de coller ce prompt : place `cahier-des-charges-matchlo.md` et `tailwind.config.js` à la racine du projet (ou dans les fichiers du Projet Claude). Puis colle le bloc ci-dessous dans Claude Code.

---

Tu démarres le projet **Matchlo** (application mobile de mise en relation par swipe entre talents et entreprises, marché Algérie).

**Étape 0 — Lis d'abord `cahier-des-charges-matchlo.md` en entier** : c'est la source de vérité. Utilise `tailwind.config.js` fourni **tel quel** (charte officielle, tokens uniquement — aucune couleur ni espacement en dur dans les écrans).

**1. Scaffold**
- Expo (React Native + TypeScript) avec **Expo Router** (routing par fichiers) et **NativeWind v4**.
- `app.config.ts` : `name: "Matchlo"`, `slug: "matchlo"`, bundle iOS `com.matchlo.app`, package Android `com.matchlo.app`. **Fige ces identifiants maintenant.**

**2. Dépendances**
- `nativewind`, `@supabase/supabase-js`, `zustand`, `@tanstack/react-query`
- `expo-font` + la police de la charte (par défaut `@expo-google-fonts/inter` — remplace si Claude Design utilise une autre famille)
- `expo-linear-gradient` (dégradés des avatars/cartes/écran match)
- `expo-notifications`, `expo-localization` + `i18next` / `react-i18next`, `react-native-svg`

**3. Config visuelle**
- Branche le `tailwind.config.js` fourni dans NativeWind.
- Charge la police via `expo-font` au démarrage (garde le Splash visible jusqu'au chargement) pour éviter tout écart de rendu.
- Respecte le thème **sombre dominant** + les **variantes claires** présentes dans les maquettes (messages, détail mission, évaluation, admin).

**4. Supabase**
- Client configuré via `.env` (`SUPABASE_URL`, `SUPABASE_ANON_KEY`).
- Crée les **migrations SQL** du §7 du cahier des charges dans `/supabase/migrations` : tous les `enum`, toutes les tables, et la **RLS du §7.1 activée partout**. Inclure les colonnes `latitude`/`longitude` (profiles + missions) et activer les extensions `cube` + `earthdistance` pour le **filtre par rayon**.
- `process_swipe` en **Edge Function** (ou RPC `security definer`) selon le §8, avec la règle du `moderation_status` (`not_required` pour onsite, `pending_admin` pour influenceur).
- Ajoute `expo-location` pour capter la position (lat/lng) à l'onboarding, avec repli sur saisie manuelle si la permission est refusée.

**5. i18n & RTL**
- Structure FR / AR (RTL) / EN avec `I18nManager`, fichiers de traduction (placeholders acceptés). Layouts en flexbox, marges `start`/`end` (jamais left/right en dur).

**6. Architecture Expo Router**
- Groupes : `(auth)`, `(talent)`, `(company)`. Un écran par fichier.

**7. Implémente la PHASE 1 COMPLÈTE (cf. §13)**
- **Auth** : email → **OTP** (Supabase Auth) → **choix du rôle** (talent / entreprise).
- **Onboarding talent hôte/hôtesse** (3 étapes : photos, infos, profil pro) + **onboarding entreprise** (logo, raison sociale, secteur, wilaya, description, RC, NIF). À l'onboarding, **capture de la position** (lat/lng) via `expo-location` ou saisie manuelle.
- **Decks de swipe** dans les deux sens (entreprise→profils, talent→annonces) avec **filtres wilaya + rayon (km)** + `process_swipe` + création de **matchs**.
- **Chat temps réel** (Supabase Realtime), conditionné par la RLS du gate.
- **Détail de mission** (vue talent) et **Profil**.
- États de chargement (skeleton loaders) et gestion d'erreurs sur chaque écran.

**8. Règles de qualité**
- Pas de mock côté client : tout passe par Supabase dès le MVP (un **seed** sert de données de démo).
- Code commenté en français. Implémentation **complète et fonctionnelle**, sans placeholders.
- `README` : setup Supabase, variables d'env, lancement Expo, déploiement EAS.

**Ne traite que la Phase 1 pour l'instant.** Une fois validée sur Expo Go, on enchaînera la Phase 2 (sous-type influenceur + gate de modération admin + console web).

Si une décision bloque l'architecture, pose-moi la question avant de coder. Sinon, commence.
