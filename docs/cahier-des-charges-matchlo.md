# CAHIER DES CHARGES — MATCHLO
### Application de mise en relation par swipe entre talents (hôtes/hôtesses + influenceurs) et entreprises

> **Pour Claude Code** : ce document est la source de vérité du projet. Lis-le intégralement avant tout code. Construis par phases (Phase 1 = MVP). Code complet et fonctionnel, pas de placeholders. Pose une question uniquement si une décision bloque l'architecture.

---

## 1. VISION PRODUIT

**Matchlo** est une marketplace mobile à deux faces qui applique le mécanisme de swipe et de match mutuel (façon Tinder) à la mise en relation entre **talents** et **entreprises/marques** en Algérie.

Le nom volontairement non lié à l'événementiel : Matchlo couvre deux familles de talents.

- **Talents** (deux sous-types) :
  - **Hôtes / hôtesses d'accueil** : missions *présentielles* (salon, conférence, concert…), rémunération en cash sur place, preuve de présence par QR.
  - **Influenceurs** : missions *à distance* (post, story, reel, vidéo), livrable numérique, aucune rencontre physique → besoin de confiance spécifique.
- **Entreprises / marques** : publient des annonces et swipent sur des profils.
- **Match** : un talent like une annonce ET l'entreprise like ce profil pour cette annonce → match → ouverture du chat in-app.

**Modèle de lancement : 100 % gratuit**, pour maximiser la collecte de données (chaque swipe, match, mission = signal pour le futur algorithme et la future monétisation). La monétisation est conçue dès maintenant mais désactivée au lancement.

---

## 2. PÉRIMÈTRE & RÔLES

| Rôle | Sous-type | Plateforme |
|---|---|---|
| Talent | Hôte/hôtesse | **Mobile (canal principal) + Web** |
| Talent | Influenceur | **Mobile (canal principal) + Web** |
| Entreprise | — | **Mobile + Web** |
| Admin | — | **Web uniquement** (console de modération) |

> Le **mobile reste le canal principal des talents** (notifications temps réel pour décrocher une mission vite, usage en déplacement). Le web sert l'**acquisition**, l'inscription et la création de profil, avec une **incitation forte à installer l'app mobile** (cf. §4 : landing page avec badges stores + bandeau d'incitation). Le push web étant limité (surtout iOS), la valeur temps réel se joue en natif.

---

## 3. STACK TECHNIQUE

- **Mobile** : Expo (React Native + TypeScript), Expo Router (routing par fichiers), NativeWind v4.
- **Backend** : Supabase — Auth (OTP email), Postgres + **RLS**, Storage (photos/logos/pièces d'identité), Realtime (chat, notifs in-app), Edge Functions (logique serveur sensible).
- **État & data** : Zustand (état local/UI), TanStack Query (cache serveur).
- **Notifications** : Expo Push Notifications.
- **Paiements** : Chargily Pay (CIB/Edahabia) — **intégré mais inactif** au lancement (monétisation = phase ultérieure).
- **i18n** : FR / AR (RTL) / EN. Devise : DZD.
- **Web (landing + talent + entreprise + admin)** : Next.js, voir §3.1.
- **Géolocalisation** : coordonnées (lat/lng) sur les profils et les missions → **filtre par rayon** (extensions Postgres `cube` + `earthdistance`, ou PostGIS). Capture via `expo-location` (mobile) ou sélection manuelle (web).
- **Charte** : tokens partagés via `tailwind.config.js` (cf. §12), thème sombre + variantes claires.

### 3.1 Stratégie web
Le web couvre **les quatre surfaces** : landing publique, espace talent (acquisition/profil), espace entreprise (gestion riche) et console admin (modération). Le mobile reste le canal principal des talents.

**Décision : Option B — app web séparée en Next.js, backend Supabase partagé.**
- App mobile (Expo) = talents + entreprises nomades, **notifications temps réel**.
- Web Next.js = **landing page** (avec badges App Store / Play Store) + **espace talent web** (inscription, création/édition de profil, consultation — avec bandeau d'incitation à installer l'app) + **espace entreprise** (annonces, candidats, missions, exports, **quotas** cf. §9) + **console admin** (modération).
- Tout tape sur le **même** Supabase : mêmes tables, mêmes RLS. Aucune duplication de logique métier.

> ✅ **Décidé : Option B (Next.js séparé)**, Supabase partagé. `react-native-web` écarté. Le web talent est **secondaire** (acquisition) et pousse activement vers l'app mobile.

---

## 4. PARCOURS & ÉCRANS (référence design : 13 maquettes existantes)

### ① Authentification
Connexion (email) → **OTP** (code 6 chiffres) → **choix du rôle** (« Je suis un talent » / « Je suis une entreprise »). Connexion sociale Google/Apple en option.

### ② Onboarding talent (3 étapes) — **différencié selon le sous-type**
Choix du sous-type talent en entrée : **hôte/hôtesse** ou **influenceur**.

- **Hôte/hôtesse** : Étape 1 Photos (2–6, 1ʳᵉ = portrait principal) · Étape 2 Infos (prénom, nom, naissance, genre, wilaya, langues) · Étape 3 Profil pro (taille, expérience, types d'événements, tarif journalier DZD, disponibilité, bio).
- **Influenceur** *(hypothèses à valider — cf. §14)* : Étape 1 Photos/visuels · Étape 2 Infos (prénom, nom, wilaya, langues) · Étape 3 Profil créateur : **réseaux + handles + nombre d'abonnés** (Instagram, TikTok, YouTube, Facebook…), **niches** (mode, beauté, food, tech, lifestyle, sport, gaming…), **types de livrables** (post, story, reel, vidéo), **tarif** (par post / par campagne), portfolio (liens/exemples), taux d'engagement (optionnel).

### ③ Onboarding entreprise
Profil société : logo, raison sociale, secteur, wilaya, description, **N° RC** + **NIF** (obligatoires) → soumission pour **vérification**.

### ④ Accueil / acquisition
- **Mobile** : écran d'entrée orienté conversion (proposition de valeur, aperçu de profils/talents vérifiés, CTA inscription).
- **Landing page (web)** : page publique de présentation avec, en évidence, les **badges « Télécharger sur l'App Store » et « Disponible sur Google Play »** pour pousser l'installation de l'app mobile.
- **Bandeau d'incitation (web, côté talent)** : à la création/édition de profil dans l'espace talent web, un **bandeau persistant en haut de page** incite à installer l'app mobile — message type : « Installez l'app Matchlo pour recevoir plus d'offres, des notifications en temps réel et accepter les missions des entreprises où que vous soyez. » + boutons stores.

### ⑤ Découverte / swipe
- **Côté entreprise** : deck de **profils talents** (carte plein écran, badge vérifié, note, like/dislike/super-like).
- **Côté talent** : deck d'**annonces de missions**.
- **Filtres (les deux côtés)** : par **wilaya/région** **et** par **rayon** (distance en km autour de la position) — cf. §3 géolocalisation. Côté entreprise, le rayon se calcule depuis le lieu de l'événement ; côté talent, depuis sa position de base.

### ⑥ Détail de mission (vue talent)
Rémunération, durée, dates, tenue/exigences, profil recherché, statut « urgent », bouton **Postuler**.

### ⑦ Matchs & messages
Liste des matchs récents + conversations. **Chat temps réel** in-app (Realtime).
- **Contact direct (sans match)** : l'entreprise peut envoyer une **demande de contact** sur une annonce précise (consomme un quota « message direct »). Le talent la reçoit dans son onglet **« Demandes »** et **doit l'accepter** (consentement) → à l'acceptation, un `match` est créé et le chat s'ouvre. Refus possible. Anti-spam : plafond de demandes, accès au signalement.

### ⑧ Espace talent (onglets)
Mes missions (statuts : proposée / acceptée / présence confirmée / terminée + **QR de présence** pour hôtes) · Activité (matchs, vues, super-likes, missions proposées) · Profil (visibilité, vues, likes reçus, langue) · **Qui a liké mon profil**.

### ⑨ Espace entreprise (onglets)
Mes annonces (likes / matchs / postes pourvus) · Créer une annonce (titre, type, wilaya, dates, postes, rémunération, profil recherché) · Deck candidats (swipe) · Missions (suivi + **Scanner QR** pour le check-in présentiel).

### ⑩ Moments clés
« C'est un match ! » · **QR de présence** (hôtes, présentiel) · **Évaluation bidirectionnelle** post-mission (note + points forts + commentaire).

### ⑪ Utilitaires
**Vérification d'identité** (pièce privée, vue modération uniquement → badge vérifié) · **Signalement** (motifs : contenu inapproprié, faux profil, harcèlement, arnaque/fraude, autre) · **Scan check-in** (entreprise scanne le QR du talent).

### ⑫ Console admin (web)
Statistiques (talents, entreprises, annonces, matchs, missions, vérifs en attente, signalements, croissance) · **Vérifications** (approuver/rejeter pièces d'identité & RC/NIF) · **Signalements** (examiner / action prise) · **Modération des missions influenceurs** (cf. §5).

---

## 4.1 ACQUISITION & BASCULE VERS LE MOBILE (« push to install »)

Objectif : pousser fortement les talents vers l'app mobile, **sans agacer ni abîmer la confiance** (public sensible). Principe directeur : rendre l'app objectivement plus utile et déclencher les incitations **aux bons moments**, jamais en matraquant. Stratégie en trois leviers (A + B + C).

### A. Asymétrie de capacités (le levier principal)
L'app mobile fait des choses que le web ne peut pas — c'est ça qui convertit, plus que n'importe quel pop-up.
- **Notifications temps réel** = mobile uniquement (push web faible, surtout iOS).
- **Accepter une mission** en un geste + **chat avec notifications** = expérience pleine sur mobile.
- **QR de présence / check-in** = mobile (caméra).
- Sur le web, ces actions s'affichent avec une mention **« Disponible sur l'app »** + lien store, qui pousse naturellement sans harceler.

### B. Pop-ups & bannières (plafonnés)
- **Pop-up post-connexion** : affiché à la **1ʳᵉ connexion**, puis **espacé** ; tout rejet est **respecté** (jamais à chaque login). Bouton de fermeture clair et visible.
- **Smart App Banner natif** : bandeau « Ouvrir dans l'app » de Safari iOS + équivalent Android. Discret, fort taux de clic.
- **Déclencheurs à forte intention** (plus efficaces que l'ouverture) : profil complété, 1er like/match reçu, 1ʳᵉ offre disponible → « Installez l'app pour répondre tout de suite ».
- *(Optionnel, à doser)* bandeau collant en bas sur navigateur mobile.

### C. Réduire la friction d'installation (handoff vers le téléphone)
- **QR code** sur la version desktop → ouvre directement le store.
- **« Recevez le lien par SMS »** : l'utilisateur saisit son numéro et reçoit le lien d'installation (prévoir un fournisseur SMS + consentement).
- **Deferred deep linking** : après installation, l'utilisateur atterrit exactement là où il était (son match, son offre). C'est ce qui fait grimper la conversion install → usage (prévoir un service type Branch ou équivalent).

### Garde-fous (à respecter impérativement)
- Jamais de pop-up à chaque connexion sans plafond, ni fermeture cachée, ni blocage total du web.
- Les messages FOMO (« X offres cette semaine ») doivent être **vrais**.
- Le web talent reste **pleinement utilisable** pour l'inscription et le profil ; on incite, on ne punit pas.

> Mise en œuvre : essentiellement **Phase 2** (web Next.js). Le levier A côté mobile (notifications, chat, QR) relève déjà de la Phase 1 / Phase 3.

---

## 5. LE DIFFÉRENCIATEUR INFLUENCEUR (gate de modération admin)

Les influenceurs ne rencontrent jamais l'entreprise physiquement. Pour prévenir les arnaques entre les deux parties, **toute mission influenceur passe par une validation admin avant ouverture du contact**. Modèle retenu : **tiers de confiance humain** (pas d'escrow financier au lancement, puisque gratuit).

**Flux mission influenceur (DOUBLE FEU VERT) :**
1. L'entreprise publie une annonce de type *influenceur* (brief, livrables, deadline, rémunération).
2. Swipe / match → mission en `moderation_status = pending_admin`, **chat fermé**.
3. **Feu vert 1 — Admin** : vérifie entreprise légitime (RC/NIF) + brief clair + rémunération cohérente → `approved`. **Le chat s'ouvre** pour que les deux parties s'accordent sur le brief et le montant.
4. **Paiement hors application** (bon de commande : virement / BaridiMob). L'app ne détient jamais les fonds.
5. **Feu vert 2 — Influenceur** : il confirme « paiement reçu » dans l'app → engagement `in_progress` (**production débloquée**). C'est l'influenceur qui débloque, car lui seul atteste la réception.
6. L'influenceur produit puis **soumet la preuve de livrable** → `delivered` → l'entreprise valide (ou validation auto après deadline) → `completed` → **évaluation bidirectionnelle**.

**Litiges & arbitrage admin :**
- Influenceur payé qui ne livre pas → l'entreprise signale → l'admin sanctionne l'influenceur (retrait du badge, baisse de note, suspension/bannissement). Levier réel : l'influenceur bâtit sa réputation sur la plateforme.
- Paiement contesté (entreprise affirme avoir payé / influenceur conteste) → l'admin arbitre sur preuve.
- **Message côté entreprise** au match influenceur, formulation neutre et conforme stores (cf. §6.1) : « Le paiement de cette mission se règle par bon de commande, hors application. La mission se débloque dès que l'influenceur confirme la réception du paiement. »

**Flux mission hôte/hôtesse (présentiel) :** match → chat immédiat (pas de gate) → mission sur place → **QR de présence** scanné par l'entreprise → paiement cash sur place → évaluation.

> Évolutions prévues (post-lancement) : option **acompte/solde** (ex. 50 % au déblocage, 50 % à la livraison) pour équilibrer le risque côté entreprise ; puis **escrow** via Chargily quand la monétisation le justifie.

---

## 6. SÉCURITÉ & CONFIANCE

- **Vérification entreprise obligatoire** (RC/NIF) avant publication d'annonces.
- **Vérification d'identité talent** : **incitative, proposée juste après l'inscription** pour pousser au **badge bleu vérifié** (avantages : badge visible, priorité dans le deck, confiance accrue des entreprises). **Non bloquante** — l'utilisateur peut continuer sans vérifier. Pièce stockée privée, vue par la seule modération ; revue côté admin (web).
- **Chat uniquement in-app** jusqu'au match ; coordonnées masquées.
- **Gate de modération** pour missions influenceurs (cf. §5).
- **Signalement** + back-office de traitement.
- **Confidentialité** : consentement explicite à l'inscription ; données sensibles (pièces d'identité, mineurs interdits) protégées ; minimisation. Important vu le public (jeunes femmes, créateurs).

### 6.1 Conformité App Store / Google Play (monétisation)
Deux flux d'argent, deux traitements distincts :
- **Rémunération des missions** (entreprise → talent) = **service du monde réel** → paiement hors store autorisé par Apple et Google (cash sur place pour les hôtes ; bon de commande hors-app pour les influenceurs). Conforme.
- **Quotas plateforme** (annonces urgentes, messages directs sans match) = **fonctionnalités numériques** → soumises à l'IAP Apple / Play Billing **si vendues dans l'app mobile**. L'Algérie n'est pas couverte par les programmes de liens externes (réservés US/EEE/Japon).

**Règle Matchlo (impérative) :** les quotas se vendent et se gèrent **uniquement sur le dashboard web entreprise**. L'app mobile **n'affiche aucun bouton d'achat, aucun lien, aucune incitation** à payer hors-app. Elle se limite à montrer le **compteur** ; à épuisement, la fonctionnalité se désactive avec un message **neutre** (ex. « Quota épuisé — gérez vos quotas depuis votre espace web »). Au lancement gratuit, aucune transaction → aucun enjeu tant que les quotas ne sont pas activés.

---

## 7. MODÈLE DE DONNÉES (Postgres / Supabase)

> Schéma de référence. Les types `enum` cadrent la logique métier. RLS activée sur **toutes** les tables.

```sql
-- Rôles & sous-types
create type user_role        as enum ('talent', 'company', 'admin');
create type talent_type      as enum ('host', 'influencer');
create type mission_type     as enum ('onsite', 'influencer');
create type swipe_direction  as enum ('like', 'dislike', 'superlike');
create type mission_status   as enum ('proposed','accepted','awaiting_payment','in_progress','presence_confirmed','delivered','completed','disputed','cancelled');
-- onsite     : proposed → accepted → presence_confirmed → completed
-- influenceur: (moderation approved) → awaiting_payment → in_progress (influenceur confirme paiement) → delivered → completed
create type moderation_status as enum ('not_required','pending_admin','approved','rejected');
create type verification_status as enum ('unverified','pending','verified','rejected');

-- Profil de base (1 ligne par utilisateur, lié à auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null,
  full_name text,
  wilaya text,
  latitude double precision,     -- position de base (filtre par rayon)
  longitude double precision,
  languages text[],
  photo_url text,
  is_verified boolean default false,
  verification_status verification_status default 'unverified',
  created_at timestamptz default now()
);

-- Détails talent (hôte/hôtesse OU influenceur)
create table talent_profiles (
  profile_id uuid primary key references profiles(id) on delete cascade,
  talent_type talent_type not null,
  birth_date date,
  gender text,
  bio text,
  -- hôte/hôtesse
  height_cm int,
  experience_years int,
  event_types text[],
  daily_rate_dzd int,
  availability text[],
  -- influenceur
  social_handles jsonb,          -- {"instagram":{"handle":"@x","followers":12000}, ...}
  niches text[],                 -- ['mode','food','tech',...]
  deliverable_types text[],      -- ['post','story','reel','video']
  rate_per_post_dzd int,
  portfolio_urls text[]
);

-- Détails entreprise
create table company_profiles (
  profile_id uuid primary key references profiles(id) on delete cascade,
  legal_name text not null,
  sector text,
  description text,
  logo_url text,
  rc_number text not null,
  nif text not null
);

-- Annonces de mission
create table missions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references profiles(id) on delete cascade,
  title text not null,
  mission_type mission_type not null,
  event_type text,
  wilaya text,
  latitude double precision,     -- lieu de l'événement (filtre par rayon, missions onsite)
  longitude double precision,
  start_date date,
  end_date date,
  positions int,
  pay_dzd int,
  required_profile jsonb,        -- langues, exp, genre, niches attendues...
  is_urgent boolean default false,
  status text default 'active',  -- active/complete/draft
  created_at timestamptz default now()
);

-- Swipes (talent sur annonce, ou entreprise sur profil)
create table swipes (
  id uuid primary key default gen_random_uuid(),
  swiper_id uuid references profiles(id) on delete cascade,
  mission_id uuid references missions(id) on delete cascade,
  target_talent_id uuid references profiles(id),  -- rempli quand l'entreprise swipe un talent
  direction swipe_direction not null,
  created_at timestamptz default now(),
  unique (swiper_id, mission_id, target_talent_id)
);

-- Matchs (créés côté serveur par process_swipe)
create table matches (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid references missions(id) on delete cascade,
  talent_id uuid references profiles(id) on delete cascade,
  company_id uuid references profiles(id) on delete cascade,
  moderation_status moderation_status default 'not_required',
  created_at timestamptz default now(),
  unique (mission_id, talent_id)
);

-- Demandes de contact direct (entreprise → talent, SANS match préalable)
-- Consomme un quota "message direct". Le talent DOIT accepter (consentement).
-- À l'acceptation → création d'un match → flux normal.
create table contact_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references profiles(id) on delete cascade,
  talent_id uuid references profiles(id) on delete cascade,
  mission_id uuid references missions(id) on delete cascade, -- annonce concernée
  message text,
  status text default 'pending',  -- pending / accepted / declined
  created_at timestamptz default now(),
  unique (company_id, talent_id, mission_id)
);

-- Missions engagées (après match accepté)
create table engagements (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references matches(id) on delete cascade,
  status mission_status default 'proposed',
  presence_qr text,              -- hôtes : token QR de présence
  payment_confirmed_at timestamptz, -- influenceurs : horodatage de la confirmation "paiement reçu"
  payment_confirmed_by uuid references profiles(id), -- = l'influenceur ; déclenche le passage en in_progress
  deliverable_proof text,        -- influenceurs : preuve de livrable (lien/post)
  created_at timestamptz default now()
);

-- Messages (Realtime)
create table messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references matches(id) on delete cascade,
  sender_id uuid references profiles(id),
  body text,
  created_at timestamptz default now()
);

-- Évaluations bidirectionnelles
create table ratings (
  id uuid primary key default gen_random_uuid(),
  engagement_id uuid references engagements(id) on delete cascade,
  rater_id uuid references profiles(id),
  ratee_id uuid references profiles(id),
  stars int check (stars between 1 and 5),
  tags text[],
  comment text,
  created_at timestamptz default now()
);

-- Vérifications (modération)
create table verifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  doc_url text,                  -- privé
  status verification_status default 'pending',
  reviewed_by uuid,
  created_at timestamptz default now()
);

-- Signalements
create table reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references profiles(id),
  target_id uuid,                -- profil ou annonce
  reason text,                   -- inapproprié / faux / harcèlement / arnaque / autre
  details text,
  status text default 'open',    -- open/reviewed/actioned
  created_at timestamptz default now()
);
```

### 7.1 Principes RLS
- Un utilisateur ne lit/écrit que **ses** lignes (`profiles`, `talent_profiles`, `company_profiles`).
- `missions` : lecture publique des actives ; écriture réservée au `company_id` propriétaire **et** entreprise vérifiée.
- `swipes` : insertion par le `swiper_id` seulement.
- `matches` : lecture par le talent et l'entreprise concernés uniquement.
- `messages` : lecture/écriture réservées aux deux membres du `match`, **et** uniquement si `moderation_status IN ('not_required','approved')` (le gate influenceur).
- `verifications.doc_url`, `reports` : visibles uniquement par le rôle `admin`.
- Toute logique sensible (création de match, ouverture du chat, validation admin) passe par des **Edge Functions** / `security definer`, jamais par le client.

---

## 8. LOGIQUE DE MATCHING (serveur)

Fonction `process_swipe()` (Edge Function ou RPC `security definer`) :
1. Enregistre le swipe.
2. Si `like`/`superlike`, vérifie le swipe réciproque (talent×annonce ↔ entreprise×profil).
3. Si réciproque → crée le `match`.
4. Définit `moderation_status` : `not_required` si mission `onsite`, **`pending_admin`** si mission `influencer`.
5. Émet les notifications (match, ou « en attente de validation » pour l'influenceur).

L'ouverture du chat est conditionnée par `moderation_status` (cf. RLS §7.1).

---

## 9. MONÉTISATION (conçue, désactivée au lancement)

Gratuit total au lancement. Tiers prévus (activation phase ultérieure) :
- **Talent+** : badge, boost de visibilité, voir « qui a liké ».
- **Company Pro / Premium** : annonces illimitées, super-likes, message direct, **Boost urgence** (push géolocalisé).
- **Quotas** (annonces urgentes, messages directs sans match) : gérés par **compteurs** sur le profil entreprise, rechargés via le **dashboard web uniquement**, jamais vendus ni incités dans l'app mobile (cf. §6.1). Provisionnement manuel par l'admin au lancement, automatisable plus tard.
- **Escrow influenceur** (évolution) : paiement séquestré libéré après livraison validée.

---

## 10. INTERNATIONALISATION & RTL
FR / AR (RTL complet) / EN. Devise DZD. Tester systématiquement l'inversion RTL (layouts en flexbox, pas de marges codées en dur gauche/droite → utiliser `start`/`end`).

---

## 11. NOTIFICATIONS PUSH (catalogue)
Nouveau match · Mission proposée · Message reçu · Super-like reçu · Profil consulté · **Mission influenceur en attente de validation** · **Mission validée par l'admin** · Vérification approuvée/rejetée · Rappel de présence (hôtes) · Demande d'évaluation post-mission · **Réengagement** : « Une entreprise s'intéresse à votre profil — répondez depuis l'app » · **Offre disponible près de vous** (push géolocalisé).

---

## 12. CHARTE GRAPHIQUE & DESIGN SYSTEM

Source de vérité : **`tailwind.config.js`** (tokens extraits des maquettes). Règle : aucune couleur/espacement en dur dans les écrans, toujours via les tokens.

- **Thème sombre** dominant (fond navy `#0A1224`, surfaces `#15233D`), **variantes claires** sur certains écrans (messages, détail mission, évaluation, console admin).
- **Bleu primaire** `#3B7BF6` (actions, badge vérifié), **violet** `#7C5CFF` (accent influenceur/immersif), **vert** `#22C55E` (match/présence), **ambre** `#F5A623` (CTA « qui a liké »), **rouge** `#F43F5E` (dislike/urgent/signalement), **or** `#F5C518` (« C'est un match »).
- **Dégradés** (avatars, cartes, écran match) via `expo-linear-gradient`.
- **Police** : charger via `expo-font` **exactement** la même que dans Claude Design (sinon écart de rendu garanti).
- Rayons : cartes 20, boutons/inputs 14, chips/avatars ronds.

---

## 13. ROADMAP PAR PHASES

- **Phase 1 — MVP** : Auth + OTP + choix rôle · Onboarding talent (hôte/hôtesse) + entreprise · **Capture de la position (lat/lng)** · Decks de swipe (2 sens) avec **filtres wilaya + rayon** · `process_swipe` + matchs · Chat temps réel · Détail mission · Profil. Données réelles via Supabase dès le départ (seed = démo).
- **Phase 2 — Influenceur + Web** : onboarding influenceur · missions influenceur · **gate de modération admin** · **app web Next.js** : landing page (badges stores) + **espace talent web** (avec bandeau d'incitation à installer l'app) + espace entreprise (annonces, candidats, missions, **quotas**) + console admin (stats, vérifs, signalements, modération missions).
- **Phase 3 — Confiance & réputation** : vérification d'identité/entreprise · badges · évaluations bidirectionnelles · QR de présence + check-in · signalement.
- **Phase 4 — Monétisation** : activation tiers (Talent+, Company Pro/Premium, Boost) via Chargily.
- **Phase 5 — Évolutions** : **escrow influenceur façon Fiverr/Upwork** (fonds séquestrés via Chargily, libérés à la livraison validée, jalons acompte/solde, arbitrage avec remboursement possible — nécessite statut d'intermédiaire de paiement + commission, donc post-monétisation) ; algorithme de classement du deck ; analytics produit.

---

## 14. DÉCISIONS (toutes tranchées)
- ✅ **Profil influenceur** : réseaux + abonnés + niches + types de livrables + tarif par post.
- ✅ **Quotas** : gérés/rechargés sur le web uniquement, invisibles à l'achat sur mobile (§6.1).
- ✅ **Déblocage influenceur** : confirmation « paiement reçu » par l'influenceur (§5). Modèle manuel au lancement ; escrow façon Fiverr/Upwork visé en Phase 5.
- ✅ **Chat influenceur** : ouvert dès l'approbation admin (avant paiement), pour s'accorder sur le brief et le prix.
- ✅ **Web entreprise + admin** : Next.js séparé, Supabase partagé (§3.1).
- ✅ **Vérification d'identité talent** : incitative, proposée juste après l'inscription (badge bleu + avantages), non bloquante (§6).
- ✅ **Mineurs** : exclusion stricte (18+) dès l'inscription.
- ✅ **Web pour les talents** : oui, en plus du mobile (canal principal). Web = acquisition, pousse vers l'app mobile (landing + bandeau, §4).
- ✅ **Filtre par rayon** : ajouté à côté du filtre wilaya, pour les deux côtés (§3, §4 ⑤, §7).
- ✅ **Stratégie « push to install »** (§4.1) : trio A (asymétrie de capacités) + B (pop-up plafonné, smart banner, déclencheurs à forte intention) + C (QR, lien SMS, deferred deep linking). Garde-fous anti-nag respectés.
