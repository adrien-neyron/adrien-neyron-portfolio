# Audit contenu et accessibilité (21 octobre 2026)

Branche `fix/audit-contenu-a11y`. Premier passage issu de la liste « Chantier Portfolio » (lecture du texte de la page publique).

## Corrigé

- **Ancienneté** : « 17 ans de sport » remplacé par « 12 ans de formation et de management » partout où le texte apparaissait (meta description, accueil, fiche Randonneur, cadran de la montre `DIAL_T.xpValue`, `pages/about.vue`, `pages/camp-de-base.vue`, libellé du champ admin « Valeur »). Règle : 12 ans de formation et management + 5 ans de développement, jamais « 17 ans ».
- **Nom** : `<title>` et description en « Adrien Neyron » (et non « Adri »).
- **Partage et référencement** : balises Open Graph (`og:type`, `og:locale`, `og:site_name`, `og:title`, `og:description`, `og:url`, `og:image`, `og:image:alt`), `twitter:card` et lien canonique, dans `components/loop/LoopHome.vue` (constante `SITE_URL`). `og:image` utilise `public/profile.png` en attendant une image dédiée 1200×630.
- **Noms accessibles** (RGAA 6.1 · WCAG 2.5.3) : « Passer » devient « Passer le chargement », les trois « Fermer » deviennent « Fermer le profil / les réglages / la fiche ». Le texte visible reste inclus dans le nom accessible.
- **Sans JavaScript** : le `<noscript>` ne parle plus de « prototype ».

## Constaté, non modifié

- Le lien « Cordée » (`#brand`) n'est pas un second lien d'évitement : c'est le lien de marque, son `aria-label` est « Cordée, retour à l'accueil ». Seul « Aller au contenu » sert d'évitement.
- « Fiche complète » et « Voir la fiche » ont déjà un complément `sr-only` (nom du projet).
- Les fautes « DEVELOPPEUR » et « Typescript » ne sont pas dans le code : elles viennent du contenu saisi dans /admin.

## Vérifié

- `npm test` : 136 tests passent. `npm run build` : réussi.
- Rendu 1280×800 (clair) et 390×800 (sombre) : le cadran affiche « 12 ANS », la bande de preuves « 12 ans de formation et de management ».
- axe-core sur l'accueil : une seule alerte `region` (texte `sr-only` `#ctaDesc` hors repère), non liée à ce changement.

## Non vérifié

- Contrastes mesurés, test clavier complet, lecteur d'écran, Lighthouse mobile.
- Ouverture de la fiche Profil dans le rendu automatisé.
- Contenu saisi en base (Mongo) : une valeur « 17 ans » saisie dans /admin (`loopDialXpValue`, `loopFacts`) l'emporte sur les textes par défaut ci-dessus.
