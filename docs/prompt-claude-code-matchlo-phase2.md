# PROMPT DE DÉMARRAGE — CLAUDE CODE · MATCHLO (Phase 2)

> Pré-requis : la Phase 1 est validée. Garde `cahier-des-charges-matchlo.md` (version à jour) et `tailwind.config.js` à la racine. Colle ce bloc dans Claude Code, **sur le repo existant**.

---

Tu poursuis le projet **Matchlo**. La Phase 1 (auth + OTP + choix rôle, onboarding hôte/hôtesse + entreprise, decks de swipe, `process_swipe` + matchs, chat temps réel, détail mission, profil) est en place. **Ne repars pas de zéro : étends le codebase et le même Supabase.**

**Étape 0** — Relis `cahier-des-charges-matchlo.md` (source de vérité), surtout : §5 (flux influenceur double feu vert), §6 + **§6.1 (conformité stores)**, §7 (schéma & états de mission), §9 (quotas web-only). Applique `tailwind.config.js` tel quel.

**Objectif Phase 2** : le sous-type **influenceur**, le **gate de modération admin (double feu vert)**, et l'**app web Next.js** (console admin + dashboard entreprise), sur le Supabase partagé.

## A. Migrations Supabase (compléter le schéma §7)
- Confirme/ajoute les enums : `talent_type`, `mission_type`, `mission_status` enrichi (`awaiting_payment`, `in_progress`, `disputed`…), `moderation_status`, `verification_status`.
- Étends `talent_profiles` (influenceur) : `social_handles jsonb`, `niches text[]`, `deliverable_types text[]`, `rate_per_post_dzd int`, `portfolio_urls text[]`.
- Ajoute sur `engagements` : `payment_confirmed_at`, `payment_confirmed_by` (= l'influenceur).
- Tables `verifications` (pièce privée) et `reports`.
- Compteurs de quotas sur le profil entreprise : `urgent_quota int default 0`, `direct_message_quota int default 0` (provisionnés côté web/admin uniquement).
- **RLS** : `messages` lisibles seulement si le `match` est `moderation_status IN ('not_required','approved')` (le gate). `verifications.doc_url` et `reports` réservés au rôle `admin`.

## B. Mobile — sous-type influenceur
- **Onboarding influenceur** (variante 3 étapes) : réseaux + handles + nombre d'abonnés, niches, types de livrables, tarif par post, portfolio.
- Cartes de deck + fiche profil adaptées à l'influenceur.
- **Création d'annonce influenceur** (entreprise, `mission_type = influencer`) : brief, livrables attendus, deadline, rémunération.
- **Flux double feu vert (§5)** :
  1. Au match influenceur → `moderation_status = pending_admin`, **chat fermé** + notif « en attente de validation ».
  2. Après **approbation admin** → chat ouvert. Afficher côté entreprise le **message neutre** : « Le paiement se règle par bon de commande, hors application. La mission se débloque dès que l'influenceur confirme la réception du paiement. »
  3. Bouton **« J'ai reçu le paiement »** (influenceur) → engagement `in_progress`.
  4. **Soumission du livrable** (lien/preuve) → `delivered` → validation entreprise (ou auto après deadline) → `completed` → **évaluation bidirectionnelle**.
  5. Bouton **« Signaler un litige »** → crée un `report` traité côté admin.
- **Vérification d'identité (incitative)** : juste après l'inscription, écran d'incitation au **badge bleu** (avantages : visibilité, priorité deck, confiance) ; téléversement de pièce (privée) → statut `pending`. **Non bloquant** : l'utilisateur peut continuer sans vérifier.
- **Quotas (conformité §6.1)** : afficher les compteurs côté entreprise en **lecture seule**. À épuisement, désactiver la fonctionnalité avec un message **neutre**. **Aucun bouton d'achat, aucun lien, aucune incitation à payer dans l'app mobile.**

## C. Web — Next.js (nouveau projet, Supabase partagé)
- Projet **Next.js séparé** (App Router + TypeScript), connecté au **même Supabase** (mêmes RLS). Réutilise les **mêmes tokens** : porte `tailwind.config.js` dans la config Tailwind web (le design web se transpose fidèlement).
- **Landing page publique** : présentation + **badges « App Store » et « Google Play »** bien visibles pour pousser l'installation de l'app mobile.
- **Espace talent (web)** : inscription, **création/édition de profil**, consultation. En haut de la page de création/édition de profil, un **bandeau persistant** qui incite à installer l'app mobile : « Installez l'app Matchlo pour recevoir plus d'offres, des notifications en temps réel et accepter les missions où que vous soyez. » + boutons stores. Le web talent est **secondaire** : il oriente activement vers le mobile.
- **Stratégie « push to install » (§4.1)** à implémenter côté web talent :
  - **A — Asymétrie** : pour accepter une mission / chatter / check-in, afficher « Disponible sur l'app » + lien store plutôt que l'action complète.
  - **B — Pop-ups plafonnés** : pop-up à la **1ʳᵉ connexion** puis espacé (respecter le rejet, fermeture visible) ; **Smart App Banner** natif (Safari iOS / Android) ; déclencheurs à forte intention (profil complété, 1er match, 1ʳᵉ offre).
  - **C — Friction réduite** : **QR code** desktop → store, **« recevoir le lien par SMS »**, **deferred deep linking** (atterrir là où l'utilisateur était après installation).
  - **Garde-fous** : jamais de pop-up à chaque login sans plafond, jamais de blocage total du web, messages FOMO uniquement s'ils sont vrais.
- **Console admin** (rôle `admin`) :
  - **Statistiques** : talents, entreprises, annonces, matchs, missions, vérifs en attente, signalements, croissance.
  - File **Vérifications** : aperçu sécurisé des pièces → **Approuver / Rejeter** (met à jour le badge profil).
  - File **Signalements** : marquer examiné / action prise.
  - File **Modération des missions influenceurs** : **Approuver / Rejeter** (feu vert 1 → ouvre le chat).
- **Dashboard entreprise** (rôle `company`) : gestion des annonces (avec **filtres wilaya + rayon** sur les candidats), missions, exports, et **gestion des quotas** (recharge **ici uniquement** ; au lancement, **provisionnement manuel par l'admin** qui incrémente les compteurs).

## D. Notifications (ajouts)
Mission influenceur en attente de validation · Mission validée par l'admin · Paiement confirmé · Livrable soumis · Vérification approuvée/rejetée · Litige ouvert.

## Qualité
- Tout via Supabase (pas de mock), **RLS respectée**, états de chargement + erreurs, code commenté en français, implémentation complète et fonctionnelle.
- **Conformité impérative §6.1** : aucune vente ni incitation de quota dans l'app mobile — tout sur le web.
- Mets à jour le README (lancement du projet web Next.js + variables d'env partagées).

**Ne traite que la Phase 2.** Si une décision bloque l'architecture, demande avant de coder. Sinon, commence par les migrations (A), puis le mobile (B), puis le web (C).
