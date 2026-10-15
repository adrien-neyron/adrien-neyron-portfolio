# Admin en lecture seule

**But** : le backoffice `/admin` sert de vitrine (montrer comment le site est piloté), donc tout le monde peut le parcourir. Seul l'administrateur (`ADMIN_EMAIL`) peut modifier quoi que ce soit.

## Deux verrous

1. **Serveur — le vrai verrou.** Toute route `server/api/admin/**` appelle `await requireAdminWrite(event)` en premier (garanti par `tests/unit/apiGuards.test.ts`). Un visiteur, ou un compte Auth0 qui n'est pas `ADMIN_EMAIL`, reçoit 401/403 quoi que fasse le navigateur. Les lectures `GET /api/admin/*` restent réservées à l'admin : un visiteur lit les routes publiques (`/api/projects`, `/api/carnet`, `/api/ai-tools`, `/api/profile`), qui exposent déjà ces données sur le site. Rien de nouveau n'est rendu public.
2. **Interface — le confort.** Elle n'affiche que ce que le visiteur a le droit de faire.

## Qui est admin ?

- `middleware/admin.ts` ne force plus la connexion. Il récupère une éventuelle session Auth0 (`checkSession`, qui revient tout de suite sans cookie de session), puis `useAdminSession().refreshRole()`.
- `refreshRole` appelle `GET /api/auth/role` avec le jeton d'identité, une seule fois par jeton. Le serveur répond `admin` ou `lecteur` (`isAdminRequest` dans `server/utils/requireAuth.ts` : même comparaison exacte que `requireAdminWrite`, mais ne lève jamais). L'e-mail admin n'est jamais envoyé au navigateur.
- Bouton « Connexion admin » dans la barre latérale (ou `/admin/login`) ; « Déconnexion » seulement si une session existe.

## Ce que voit un visiteur

| Écran | Visiteur | Admin |
|---|---|---|
| Toutes les pages | bandeau « Visite en lecture seule » | — |
| Listes (Projets, Carnet, Outils IA) | lien « Consulter » (cible 44 px) | Modifier / Supprimer / Importer / Nouveau |
| Fiche (`…/[id]/edit`) | titre « Consulter … », formulaire désactivé | « Modifier … », formulaire actif |
| Profil | formulaire désactivé | formulaire actif |
| `…/new` | renvoyé vers la liste | formulaire de création |

## Formulaires

Chaque `components/admin/*Form.vue` accepte `readonly`. Le contenu est enveloppé dans `<fieldset class="admin-form-body" :disabled="readonly">` : tous les champs, boutons IA, suggestions de photos et envois de fichiers sont inactifs d'un coup, le bouton Enregistrer est retiré et `onSubmit` sort immédiatement. Dans `main.css`, `.admin-form-body:disabled` garde les valeurs en `--color-text` (le gris « désactivé » du navigateur passerait sous 4,5:1). Un nouveau formulaire admin doit suivre le même modèle.

## Tests

- `tests/unit/requireAuth.test.ts` : `isAdminRequest` (sans jeton, jeton invalide, autre compte, admin, `ADMIN_EMAIL` vide).
- `tests/e2e/admin.spec.ts` : bandeau visible, aucune action d'écriture, `*/new` redirigé, champs du profil désactivés, `/api/auth/role` = `lecteur` sans jeton.
- `tests/e2e/api.spec.ts` : chaque route d'écriture refuse un appel sans jeton.

## Dette d'accessibilité connue (antérieure, admin jamais audité tant qu'il était privé)

Relevée par axe le 2026-10-14, à traiter dans une branche dédiée : pas de `<title>` propre aux pages admin, `<label>` non reliés à leurs champs dans `ProfileForm` (et probablement les autres formulaires), contraste du lien actif de la barre latérale (clair) et des encadrés d'erreur rouges (couleur brute `red`), bouton de `/admin/login` en sombre.
