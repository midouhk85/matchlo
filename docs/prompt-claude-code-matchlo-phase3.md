# PROMPT DE DÉMARRAGE — CLAUDE CODE · MATCHLO (Phase 3)

> Pré-requis : Phases 1 et 2 validées. Garde `cahier-des-charges-matchlo.md` (à jour) et `tailwind.config.js` à la racine. Colle ce bloc dans Claude Code, **sur le repo existant**.

---

Tu poursuis le projet **Matchlo**. Les Phases 1 (MVP) et 2 (influenceur + web Next.js) sont en place. **Ne repars pas de zéro : étends le codebase et le même Supabase.**

**Étape 0** — Relis `cahier-des-charges-matchlo.md`, surtout §5 (livrables/évaluations), §6 (sécurité & confiance), §7 (tables `verifications`, `reports`, `ratings`, `engagements`), §8. Applique `tailwind.config.js`.

**Objectif Phase 3 — Confiance & réputation.** Les files de modération admin (vérifications, signalements) ont été amorcées en Phase 2 ; cette phase complète **le côté utilisateur** et boucle la réputation.

## A. Vérification (identité talent + entreprise)
- **Talent (incitative)** : écran d'incitation au **badge bleu** juste après l'inscription (avantages : visibilité, priorité deck, confiance). Téléversement de pièce → Storage **privé** → statut `pending`. Non bloquant.
- **Entreprise** : vérification RC/NIF ; **seules les entreprises vérifiées publient** (déjà en RLS) — surface l'état (vérifiée / en attente / rejetée).
- **Badge vérifié** affiché partout où le profil apparaît : carte de deck, fiche profil, carte de mission, liste de matchs.

## B. Évaluations bidirectionnelles
- À la clôture d'un engagement (`presence_confirmed` pour hôtes, `delivered`/`completed` pour influenceurs), proposer aux **deux parties** une évaluation : note 1–5 + tags (ponctualité, professionnalisme, présentation…) + commentaire → table `ratings`.
- Afficher la **note agrégée** + nombre d'avis sur les profils et les cartes. Empêcher la double évaluation d'un même engagement.

## C. QR de présence + check-in (missions présentielles)
- À l'acceptation d'une mission onsite, générer un **token `presence_qr`** sur l'`engagement`.
- Côté talent : bouton **« Afficher mon QR »**.
- Côté entreprise : **« Scanner le QR »** (`expo-camera` / lecteur de code) → vérifie le token → engagement `presence_confirmed`. Gérer les cas d'erreur (QR invalide/expiré).

## D. Signalement
- Depuis un profil, une annonce ou une conversation : **signaler** (motifs : contenu inapproprié, faux profil, harcèlement, arnaque/fraude, autre) + détails → table `reports`.
- Traitement côté **console admin** (file déjà en place en Phase 2 : marquer examiné / action prise).
- **Anti-harcèlement** : plafond de demandes de contact/jour, possibilité de bloquer un interlocuteur.

## E. Réputation dans le deck
- Léger **bonus de classement** pour les profils vérifiés et bien notés (sans casser l'équité — pas de tri figé). Documente la formule.

## Qualité
- Tout via Supabase (pas de mock), **RLS respectée** (`verifications.doc_url` et `reports` réservés admin), états de chargement + erreurs, code commenté en français, implémentation complète.

**Ne traite que la Phase 3.** Si une décision bloque l'architecture, demande avant de coder.
