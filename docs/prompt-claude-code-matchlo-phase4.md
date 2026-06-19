# PROMPT DE DÉMARRAGE — CLAUDE CODE · MATCHLO (Phase 4)

> Pré-requis : Phases 1 à 3 validées. Garde `cahier-des-charges-matchlo.md` (à jour) et `tailwind.config.js` à la racine. Colle ce bloc dans Claude Code, **sur le repo existant**.

---

Tu poursuis le projet **Matchlo**. Les Phases 1 à 3 sont en place. **Ne repars pas de zéro : étends le codebase et le même Supabase.**

**Étape 0** — Relis `cahier-des-charges-matchlo.md`, surtout §9 (monétisation), **§6.1 (conformité stores — IMPÉRATIF)**, §3 (Chargily), §7 (compteurs de quotas, `contact_requests`). Applique `tailwind.config.js`.

**Objectif Phase 4 — Activer la monétisation**, dans le respect strict des règles App Store / Play.

## A. Intégration paiement
- Activer **Chargily Pay** (CIB / Edahabia) **sur le web uniquement** (dashboard entreprise). Webhooks → mise à jour serveur des droits/quotas.

## B. Tiers (activation)
- **Talent+** : badge, boost de visibilité, accès à « qui a liké mon profil ».
- **Company Pro / Premium** : annonces illimitées, super-likes, message direct, **Boost urgence**.

## C. Quotas (RÈGLE DE CONFORMITÉ §6.1 — NON NÉGOCIABLE)
- Les quotas (**annonces urgentes**, **messages directs sans match**) se vendent et se rechargent **exclusivement sur le dashboard web entreprise** (paiement Chargily).
- **App mobile** : compteurs en **lecture seule** ; à épuisement, fonctionnalité désactivée avec message **neutre** (« Quota épuisé — gérez vos quotas depuis votre espace web »). **Aucun bouton d'achat, aucun lien, aucune incitation à payer dans l'app mobile.**
- Décrémente les compteurs côté serveur à la consommation (création d'annonce urgente / envoi de demande de contact).

## D. Annonces urgentes (boost de visibilité)
- `is_urgent = true` → **classement prioritaire** dans le deck talent + **réapparition** dans le deck (au lieu d'un retrait définitif) jusqu'à ce que la mission soit pourvue ou que sa date passe.
- **Auto-expiration** à la date de l'événement. **Plafond** d'urgences par entreprise (consomme le quota).

## E. Contact direct sans match
- Activer la consommation du **quota « message direct »** sur la `contact_requests` (cf. §4 ⑦ / §7) : l'entreprise envoie une demande → le talent accepte (consentement) → création d'un match → chat.

## Qualité
- Tout via Supabase + webhooks Chargily (pas de mock), **RLS respectée**, états de chargement + erreurs, code commenté en français, implémentation complète.
- **Re-vérifier §6.1 avant de livrer** : zéro vente ou incitation de fonctionnalité numérique dans l'app mobile.

**Ne traite que la Phase 4.** Si une décision bloque l'architecture, demande avant de coder.
