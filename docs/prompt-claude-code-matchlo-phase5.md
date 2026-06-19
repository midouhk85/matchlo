# PROMPT DE DÉMARRAGE — CLAUDE CODE · MATCHLO (Phase 5)

> Pré-requis : Phases 1 à 4 validées + **cadre juridique de l'intermédiation de paiement validé par un juriste/comptable algérien** (indispensable avant l'escrow). Garde `cahier-des-charges-matchlo.md` et `tailwind.config.js` à la racine. Colle ce bloc dans Claude Code, **sur le repo existant**.

---

Tu poursuis le projet **Matchlo**. Les Phases 1 à 4 sont en place. **Ne repars pas de zéro : étends le codebase et le même Supabase.**

**Étape 0** — Relis `cahier-des-charges-matchlo.md`, surtout §5 (flux influenceur), §9 (escrow = évolution), §13 (Phase 5). Applique `tailwind.config.js`.

**Objectif Phase 5 — Évolutions** : passer du modèle de confiance manuel à un vrai escrow, affiner le matching, instrumenter le produit.

## A. Escrow influenceur (façon Fiverr / Upwork) — remplace le modèle manuel
> ⚠️ Détention de fonds de tiers = statut d'intermédiaire de paiement réglementé. **Ne pas livrer sans validation juridique préalable.**
- L'entreprise **finance la mission à l'avance** via Chargily → fonds **séquestrés** (non versés à l'influenceur).
- L'influenceur voit « fonds sécurisés » → produit en confiance.
- À la **livraison validée**, libération des fonds vers l'influenceur (moins la **commission** plateforme).
- **Jalons (milestones)** optionnels : acompte au déblocage / solde à la livraison.
- **Litiges** : l'admin arbitre et peut **rembourser** depuis les fonds retenus (pouvoir réel, contrairement au modèle manuel).
- Migration : le bouton « J'ai reçu le paiement » (modèle manuel) est remplacé par les états d'escrow ; conserver la compatibilité des engagements existants.

## B. Algorithme de classement du deck
- Score par carte = pertinence (correspondance profil ↔ besoin) + proximité (rayon) + fraîcheur + boost (urgence/premium) + réputation (note, vérifié), avec un facteur d'aléa pour éviter le figement.
- Mesurer l'effet sur le taux de match.

## C. Analytics produit
- Instrumenter les événements clés (swipe, match, demande de contact, mission acceptée, livrable, paiement) pour piloter la rétention, la conversion et le futur tuning de l'algorithme. Respect de la confidentialité (§6).

## Qualité
- Tout via Supabase + Chargily (pas de mock), **RLS respectée**, code commenté en français, implémentation complète, tests des cas de litige/remboursement.

**Ne traite que la Phase 5.** Si une décision bloque l'architecture (notamment juridique sur l'escrow), demande avant de coder.
