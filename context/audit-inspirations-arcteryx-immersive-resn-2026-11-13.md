# Audit des trois inspirations — Arc'teryx System 0, Immersive Garden, Resn
**Objectif : décider ce que le portfolio « Cordée » (Nuxt 3, Three.js, accessibilité) doit emprunter, adapter ou refuser.**
Date : 13/11/2026 · Auditeur : Claude · Sites : `arcteryx.com/us/en/explore/system0/`, `immersive-g.com`, `www.resn.co.nz`

---

## 0. Méthode, limites, étiquettes

| Élément | Détail |
|---|---|
| Ce qui a été fait | Pour chaque site : lecture du HTML et des métadonnées, chargement réel dans un navigateur (bureau), mesures dans la page (Performance API : poids, requêtes, LCP, CLS ; DOM : titres, repères, images, canvas, vidéos ; feuilles de style : règles `prefers-reduced-motion` et `:focus-visible` ; balise viewport), captures d'écran, parcours de plusieurs écrans d'Arc'teryx. Complété par des recherches sur les études de cas publiées (Awwwards, Codrops) pour les choix techniques. |
| Ce qui n'a **pas** été fait | Test mobile des trois sites, Lighthouse, lecteur d'écran, parcours clavier complet, pages internes (fiches projets, menus), son, interaction « click & hold » de Resn, mode « réduit mouvement » activé. |
| Mesures | **Une seule charge**, ordinateur de bureau, réseau non limité, contexte WebGL 1.0 sur ma machine de test. Les poids sont des **indications**. Ils dépendent des CDN, de la région et du consentement cookies. |
| Règles CSS | Je ne compte que les feuilles de style lisibles par script. Un site peut gérer le mouvement réduit ou le focus en JavaScript ou dans des feuilles inaccessibles : « 0 règle » signifie « non trouvée », pas « absent ». |
| Consentement | Sur Arc'teryx, j'ai choisi « Use only necessary cookies » pour voir la page (la bannière couvrait le héros). |
| Étiquettes | **[mesuré]** relevé en direct · **[lu]** texte ou structure vue sur la page · **[source]** étude de cas ou article cité en section 12 · **[proposition]** cible que je recommande, pas un fait. |

---

## 1. Synthèse en dix lignes

1. **Les trois sites sont des références de narration, pas de performance ni d'accessibilité.** Ce qu'ils font mieux que ton site : l'idée tenue de bout en bout, le rythme, la mise en scène d'un objet unique. Ce qu'ils font moins bien : poids, sémantique, accessibilité.
2. **Arc'teryx System 0** est le plus transposable : une page « chapitres », une phrase par écran, une vidéo par chapitre, une numérotation I–V, un repère de progression. Il reste lisible parce qu'il est **sobre**.
3. **Immersive Garden** utilise **la même pile que toi** (Nuxt + Three.js) **[source]**, mais pèse **≈ 21,7 Mo** à la charge **[mesuré]** (ton accueil : ≈ 0,55 Mo avant interaction). Leur technique de compression (Draco, KTX2) est à étudier. Leur accessibilité n'est pas un modèle.
4. **Resn** montre l'autre extrême : un seul objet 3D, « Click & hold », presque aucun HTML (63 caractères de texte visibles, aucun repère, aucun lien d'évitement) **[mesuré]**. À admirer pour la direction artistique, **à ne pas imiter** pour la structure : c'est l'inverse de ton positionnement accessibilité.
5. Ton avantage compétitif : **faire aussi immersif, sans sacrifier la sémantique**. Aucun des trois ne le fait ; c'est la place libre.
6. À emprunter à Arc'teryx : chapitres numérotés, une phrase par scène, indicateur de progression, vidéos chargées à la demande.
7. À emprunter à Immersive Garden : compression des assets 3D, section « Backstage » (making-of), menu en surimpression, soin de la première scène.
8. À emprunter à Resn : un objet signature, une interaction simple et mémorable, une ambiance sonore optionnelle.
9. À refuser chez les trois : zoom bloqué (Immersive Garden, Resn), absence de repères et de texte alternatif, poids de 20 Mo+, consentement cookies envahissant (Arc'teryx).
10. Plan en trois sprints en section 10 ; budget de performance proposé en section 9.

---

## 2. Tableau comparatif chiffré **[mesuré]**

| Indicateur | Arc'teryx System 0 | Immersive Garden | Resn | **Ton portfolio** (mesuré le 13/11) |
|---|---|---|---|---|
| Transfert à la charge | ≈ 3,0 Mo (58 requêtes) | ≈ 21,7 Mo (80 requêtes) | ≈ 23,6 Mo (130 requêtes) | ≈ 0,55 Mo (35 requêtes) |
| Transfert après quelques écrans | ≈ 5,1 Mo (vidéos par chapitre) | 21,7 Mo (déjà chargé d'emblée) | 23,6 Mo (déjà chargé d'emblée) | non mesuré (3D chargée à la première interaction) |
| Plus gros élément | Vidéo d'ouverture ≈ 2,5 Mo | `reliefs_high_compressed.glb` ≈ 5,7 Mo | `main_desktop_extended.js` ≈ 3,9 Mo | Module JS ≈ 153 Ko |
| DOMContentLoaded / load | 0,16 s / 1,5 s | 0,69 s / 6,1 s | 0,21 s / 4,2 s | 1,1 s / 1,2 s |
| LCP | ≈ 1,4 s | non relevé | non relevé | ≈ 2,4 s |
| CLS | 0,103 (au-dessus du seuil « bon » de 0,1) | 0 | non relevé | 0,005 |
| Canvas WebGL | 0 | 12 | 6 | 8 |
| Vidéos | 6 (muettes, en boucle, sans contrôle) | 0 | 0 | 0 |
| Framework détecté | Pas de global Next/Nuxt ; jQuery 3.7 ; routage client type Vike | **Nuxt** | **Three.js** (global) | Nuxt 3 + Three.js |
| Polices | Elan ITC Pro, Helvetica Now Display | PS Times, Helvetica Neue | Fort (4 graisses) | Cormorant, Inter, JetBrains Mono |
| Hauteur de document | 768 px (scène plein écran pilotée par le défilement) | — | — | page longue + scène |

Lecture : tu es environ **40 à 43 fois plus léger** à la charge que les deux agences. C'est un atout à revendiquer, pas un retard à combler.

---

## 3. Tableau comparatif accessibilité et sémantique **[mesuré]**

| Contrôle | Arc'teryx | Immersive Garden | Resn | Ton portfolio |
|---|---|---|---|---|
| `lang` de la page | `en` ✔ | `en` ✔ | **vide** ✘ | `fr` ✔ |
| `main` | 1 ✔ | **0** ✘ | **0** ✘ | 1 ✔ |
| `nav`, `header`, `footer` | 2 / 1 / 1 ✔ | 1 / 1 / **0** | **0 / 0 / 0** ✘ | 3 / 1 / 1 ✔ |
| `h1` | 1 ✔ | 1 ✔ (long, slogan) | 1 ✔ (« Resn · Creative Studio Est. 2004 ») | 1 ✔ |
| Plan de titres | h1 + 5 h2 (les cinq chapitres) ✔ | h1 seul | h1 seul | 10 h2 / 14 h3 |
| Lien d'évitement | non détecté | non détecté | non détecté | ✔ |
| Images sans `alt` | 0 sur 2 ✔ | **39 sur 39** ✘ | aucune `<img>` (tout en canvas) | 0 |
| Texte visible dans le DOM | complet | ≈ 3 000 caractères | **63 caractères** | complet |
| Règles `prefers-reduced-motion` (feuilles lisibles) | 36 ✔ | 0 | 0 | 38 ✔ |
| Règles `:focus-visible` | 2 | 0 | 0 | 84 ✔ |
| Balise viewport | zoom autorisé ✔ | `maximum-scale=1, user-scalable=0` ✘ | `maximum-scale=1, user-scalable=no` ✘ | zoom autorisé ✔ |
| Vidéos : contrôle de pause | aucun (muettes, boucle, démarrage à la demande) | — | — | — |
| Boutons exposés | 45 | 2 | **0** | 72 |
| Bannière de consentement | **Oui, plein écran sur le héros (1 027 partenaires)** | non vue | non vue | aucune |

Points saillants :
- **Resn** : 1 lien et 0 bouton dans le DOM ; toute l'interface est dans le canvas. Pour un lecteur d'écran ou un clavier, la page est quasi vide.
- **Immersive Garden** : 39 images sans `alt`, aucune zone `main`, aucun focus visible trouvé, zoom bloqué.
- **Arc'teryx** : c'est le plus correct (lang, main, titres, zoom, mouvement réduit), mais le premier écran est masqué par une bannière de consentement lourde, et les vidéos n'ont ni contrôle de pause ni transcription **[lu]**.

---

## 4. Arc'teryx — System 0

URL : `arcteryx.com/us/en/explore/system0/` · Contexte : System 0 est un cadre de conception circulaire présenté par Arc'teryx fin août 2026, dont le premier produit est la veste Sperro SV **[source : communiqués de presse]**. La page est une page de marque, pas un portfolio d'agence.

### 4.1 Concept et structure **[lu + mesuré]**
- Titre : « The Revolution is Circular ».
- **Cinq chapitres numérotés I à V** : matériaux, durabilité, réparabilité, comportements circulaires, boucler la boucle. Chaque chapitre a un titre `h2`, une ancre et une page détaillée.
- Menu : Process, Mission, Sperro SV, Arc'teryx, ReBIRD. Le mot « System 0 » en haut à gauche sert de signature.
- Mise en scène **plein écran, une phrase par écran** : un fond (vidéo d'une feuille couverte de gouttes, puis des matières, puis du tissu technique, puis un fond noir uni), un texte court centré en capitales, un **repère de progression** (trois cercles entrelacés) en bas de l'écran. Hauteur de document ≈ hauteur d'écran : le défilement fait avancer une scène.
- Les textes restent dans le HTML : la page est lisible sans JavaScript **[lu]**.

### 4.2 Ce qui fonctionne (à documenter pour s'en inspirer)
1. **Un message par écran.** Aucun écran ne contient plus d'une idée. C'est la règle qui rend la page lisible malgré le plein écran.
2. **Numérotation en chiffres romains + progression visible.** Le visiteur sait toujours où il en est.
3. **Vidéos par chapitre, chargées au moment où on y arrive** : ≈ 2,5 Mo pour l'ouverture, puis ≈ 0,3 Mo par boucle **[mesuré]**. Le coût arrive en même temps que la valeur.
4. **Typographie sobre** : une serif d'accent en capitales pour les phrases, une sans-serif de menu ; peu de tailles, beaucoup d'espace.
5. **Lien avec le produit réel** : la page sert une stratégie (circularité), pas une démonstration technique.

### 4.3 Défauts à ne pas reproduire
| Défaut | Preuve | Pourquoi c'est un risque pour toi |
|---|---|---|
| Consentement envahissant sur le héros | Bannière annonçant 1 027 partenaires, une vingtaine de titres `h2`/`h3` dans le DOM pour la gestion des cookies | Détruit le premier écran. Ton site n'a aucun suivi : garde cet avantage. |
| CLS de 0,103 | Mesuré | Au-dessus du seuil « bon » ; Awwwards compte la performance dans l'usabilité. |
| Vidéos d'ambiance sans pause ni sous-titres | 6 `<video>` muettes, boucle, sans contrôle | Mouvement permanent non contrôlable : critère WCAG 2.2.2 pour tout contenu animé de plus de 5 s. |
| Peu de styles de focus | 2 règles `:focus-visible` | Le focus clavier repose sur les styles du navigateur. |
| Pas de lien d'évitement détecté | Sélecteur non trouvé | À vérifier à la main. |
| Dépendances lourdes de suivi | Scripts d'analyse, consentement, mesure, jQuery | Hors sujet pour un portfolio. |

### 4.4 Transposition vers « Cordée »

| Idée Arc'teryx | Version Cordée | Pourquoi |
|---|---|---|
| Chapitres I à V | Étapes numérotées : **I Sommet · II Paris · III Lyon · IV Projets perso · V Bivouac** (déjà dans ta frise) | Tu as déjà la structure ; il manque la numérotation visible et la progression. |
| Une phrase par écran | Une phrase d'accroche par étape, **dans le HTML**, puis la carte 3D | Respecte « contenu 100 % HTML » ; le recruteur pressé lit la phrase seule. |
| Repère de progression | Réutiliser l'altimètre (2 480 → 35 m) et le HUD comme indicateur : « Étape 2/5 · 1 240 m » | Ton concept fait déjà ce travail ; le rendre persistant et textuel (`aria-live` poli, une fois par étape). |
| Vidéos par chapitre à la demande | Assets 3D et textures par étape, chargés à l'approche de l'étape | Évite le « tout d'un coup » des agences. |
| Menu minimal (5 entrées) | Menu « métaphore · libellé » (Étapes · Projets, Le Randonneur · À propos, Carnet, Contact) | Corrige le point d'usabilité de l'audit précédent. |
| Sobriété typographique | Garder 2 familles principales + 1 mono pour les données | Tu en utilises trois ; la hiérarchie en bénéficie. |

---

## 5. Immersive Garden — immersive-g.com

Studio parisien de production d'expériences numériques **[lu]**. Distinctions et études de cas publiées par Awwwards **[source]** : Site du mois de juillet 2023 pour ATEN7, Site du mois pour Orano (2018), Rainforest Foods (2017), études de cas sur HATOM, David Whyte, Watches & Wonders (Cartier), The Extraordinary Lab (Audemars Piguet).

### 5.1 Concept et structure **[lu + mesuré]**
- Premier écran : un **bas-relief de marbre gris** (créature fantastique sculptée) en WebGL, logo, slogan « Innovative digital experiences studio », « Scroll down », « Menu » en haut à droite, « See all projects » en bas à gauche. Palette quasi monochrome, deux polices (une serif classique, une grotesque).
- Descente : H1 manifeste, « Our approach », trois projets phares (Louis Vuitton, David Whyte, Cartier), « Our mission », liste de **18 projets** typés (Web Experience, Corporate, E-Shop), pied de page avec e-mail, adresse, newsletter, réseaux.
- Contrôle « 0 / Off / On » en pied de page (probablement le son) **[lu, usage non confirmé]**.
- Temps de chargement : l'écran est resté gris plusieurs secondes avant l'apparition de la scène dans mon test (load ≈ 6,1 s, 21,7 Mo).

### 5.2 Choix techniques documentés **[source]**
- Le site actuel est un **showcase de tous leurs projets avec des études de cas approfondies** ; Three.js pour le WebGL, **Blender, Houdini et ZBrush** pour les assets ; **Vue.js et Nuxt** pour l'interface. Détecté aussi en direct : la variable globale `__NUXT__` **[mesuré]**.
- Une section cachée, **« Backstage »**, présente les coulisses (documentaire de fabrication) comme complément des études de cas.
- Autres productions : Three.js, Blender, GSAP, scroll lissé (Lenis), Web Audio API, Sass (Watches & Wonders) ; la performance mobile est présentée comme « contrainte de base » (The Extraordinary Lab) ; pour Orano, **30 modèles 3D pesant 3,7 Mo, soit 901 Ko compressés** (2018).

### 5.3 Ce que révèlent les mesures
| Constat | Valeur |
|---|---|
| Transfert | ≈ 21,7 Mo : 15,1 Mo en `fetch` (modèles et textures), 4,7 Mo d'images, 0,7 Mo de scripts |
| Assets lourds | `reliefs_high_compressed.glb` ≈ 5,7 Mo ; `footer_compressed.glb` ≈ 3,6 Mo ; textures `.ktx2` ≈ 1,4 et 2,0 Mo ; `bg_low_draco.glb` ≈ 1,4 Mo ; boucles audio ≈ 0,35–0,44 Mo |
| Techniques de compression | **Draco** (géométrie) et **KTX2** (textures GPU) visibles dans les noms de fichiers |
| Gestion du mouvement | 0 règle `prefers-reduced-motion` trouvée |
| Alternative texte | 39 images sans `alt`, aucune zone `main` |
| Zoom | bloqué (`user-scalable=0`) |

### 5.4 Ce qui fonctionne (à documenter)
1. **Une scène signature unique** (le bas-relief) qui annonce le niveau de finition avant tout texte.
2. **Palette retenue** : gris pierre, texte noir, aucun accent superflu.
3. **Hiérarchie de contenu claire** : manifeste → approche → projets phares → mission → liste complète → contact.
4. **Études de cas profondes + Backstage** : crédibilité par la preuve de processus.
5. **Pile identique à la tienne** : preuve qu'un Nuxt + Three.js peut atteindre ce niveau de reconnaissance.

### 5.5 Défauts à ne pas reproduire
- **Poids** : 21,7 Mo à la charge. Pour un recruteur sur 4G, c'est une page qui n'apparaît pas.
- **Accessibilité** : zoom bloqué, `main` absent, images sans `alt`, focus non stylé.
- **Premier écran vide pendant le chargement** (écran gris) : pas d'état de chargement explicite.

### 5.6 Transposition vers « Cordée »

| Idée Immersive Garden | Version Cordée | Effort |
|---|---|---|
| Bas-relief comme objet signature | Ton objet signature existe : **la montre GPS 3D**. Lui donner autant de soin (matière, lumière, détail du cadran). | M |
| Compression **Draco + KTX2** | Compresser tes `.glb` (Draco ou Meshopt) et tes textures (KTX2/Basis) ; viser un chargement progressif | M |
| Section « Backstage » | Page ou dialogue **« Coulisses »** : décisions techniques (3D après le contenu, repli sans JavaScript, jetons de couleur, tests axe) : c'est ta preuve d'expertise | S |
| Menu en surimpression | Garder ton menu « Étapes / Outils », ajouter un overlay plein écran avec liste de liens HTML réels | S |
| Hiérarchie manifeste → preuves → contact | Aligner l'accueil sur cet ordre (accroche → 3 projets phares → offre → contact) | S |
| Études de cas profondes | Gabarit de fiche client (problème → action → résultat → pour votre projet) | M |
| **Ne pas** copier le poids ni le zoom bloqué | Conserver ton budget léger et le zoom autorisé | — |

---

## 6. Resn — resn.co.nz

Studio créatif fondé en 2004 (nouvelle-zélandais) **[lu : « Est. 2004 »]**. Distinctions et méthode **[source]** : Pioneer – Corn Revolutionized, **Site du mois de juillet 2020**, puis **Site de l'année** aux Awwwards ; plusieurs titres d'agence de l'année ; usage d'un framework maison (« Jelly ») léger et flexible, bâti sur **Three.js et GSAP**, avec masquage en shader, particules, bloom et bruit en post-traitement, et le soin d'optimiser la performance.

### 6.1 Concept et structure **[lu + mesuré]**
- Fond noir ; au centre, une **goutte cristalline en 3D** (la « Resn Drop ») ; texte « Resn · Creative Studio Est. 2004 » ; en haut « VIEW ALL PROJECTS » ; en bas « CLICK & HOLD » ; menu en haut à droite et icône de son en bas à droite.
- L'interaction principale est **maintenir le clic** pour entrer dans l'expérience. Il n'y a presque pas de HTML : 63 caractères de texte, 1 lien, 0 bouton, 0 repère.
- Polices Fort (4 graisses), alphabet chargé en `letters.json` (≈ 0,4 Mo) et liste de projets en `projects.json` (≈ 0,85 Mo) : le contenu semble chargé comme des **données du canvas**, pas comme du HTML (interprétation d'après les noms de fichiers, non vérifiée).
- Audio : plusieurs boucles de 0,5–0,7 Mo (ambiances, sons d'interaction).

### 6.2 Ce que révèlent les mesures
| Constat | Valeur |
|---|---|
| Transfert | ≈ 23,6 Mo, 130 requêtes, dont 13 Mo d'images et 4,4 Mo de scripts (`main_desktop_extended.js` ≈ 3,9 Mo) |
| Bibliothèque | Variable globale `THREE` détectée |
| `lang` | vide |
| Repères et titres | aucun repère ; un seul `h1` |
| Zoom | bloqué |
| Mouvement réduit, focus | 0 règle trouvée |
| Version « vieux navigateur » | image de remplacement pour navigateurs obsolètes (`old-browser.png`) |

### 6.3 Ce qui fonctionne
1. **Un objet, une matière, une interaction** : la goutte qui se brise et se recompose raconte la marque sans un mot.
2. **Interaction physique simple (« click & hold »)** : mémorable, compréhensible en une seconde, ludique.
3. **Son comme signature** (icône toujours visible, ambiance par scène).
4. **Ton éditorial** : humour, voix de marque assumée (entretien publié sur Codrops en 2026 : une agence qui veut rendre « le web un peu moins insipide »).
5. **Rigueur d'exécution du rendu** (shaders, post-traitement) sur des appareils variés selon leurs études de cas.

### 6.4 Défauts à ne pas reproduire
- Contenu absent du DOM : invisible aux lecteurs d'écran, aux moteurs de recherche, aux utilisateurs sans WebGL.
- Zoom bloqué sur mobile.
- Poids de 23,6 Mo sans alternative légère.
- Interaction « maintenir le clic » **sans équivalent clavier visible** (non confirmé : je n'ai pas testé).

### 6.5 Transposition vers « Cordée »

| Idée Resn | Version Cordée | Garde-fou d'accessibilité |
|---|---|---|
| Interaction signature maintenir-appuyer | **« Dénouer la corde »** (tu l'as déjà sur l'écran d'accueil) : en faire le geste emblématique (maintenir pour tendre la corde) | Bouton natif + équivalent clavier (Entrée / Espace pour dénouer) ; ne jamais exiger un maintien prolongé |
| Objet cristallin unique | La **montre** avec une transformation (aiguille qui se cale, aurore) comme moment fort à chaque étape | `aria-hidden` sur le canvas, résumé texte à côté |
| Ambiance sonore | Garder ton son **coupé par défaut**, avec icône toujours visible | Respect de la préférence du visiteur, jamais d'autoplay |
| Voix de marque | Deux ou trois micro-textes (légendes, états de chargement) avec la voix « sentier » | Textes réels dans le DOM |
| Ne pas copier | Contenu « en canvas » | Contenu 100 % HTML, comme aujourd'hui |

---

## 7. Ce que les jurés Awwwards récompensent chez ces références
*(Les appréciations du tableau sont les miennes, d'après les mesures ci-dessus ; ce ne sont pas des notes de jury.)*

Grille officielle : Design 40 %, Usability 30 %, Creativity 20 %, Content 10 % ; Honorable Mention à 6,5 ; Developer Award au-dessus de 7. Sous-critères Developer : WPO, Responsive, Semantics/SEO, Markup/Meta-data, Animations/Transitions, Accessibility **[source : Awwwards]**.

| Critère | Arc'teryx | Immersive Garden | Resn | Cordée (cible) |
|---|---|---|---|---|
| Design | Retenu, éditorial | Très fort, matière | Très fort, signature | Fort : montre, aurore, typographie |
| Usability | Bonne sauf consentement | Moyenne (poids, accès) | Faible (contenu en canvas) | **Doit être le point fort** |
| Creativity | Moyenne (sobre) | Élevée | Très élevée | Élevée (concept « Cordée ») |
| Content | Clair, une idée par écran | Riche (études de cas) | Minimal | À renforcer (preuves, offre) |
| Developer (WPO / Semantics / Accessibility) | Moyen+ | Faible en accessibilité et poids | Faible | **Place à prendre** |

Conclusion stratégique : **ni Immersive Garden ni Resn ne sont accessibles ; Arc'teryx l'est partiellement.** Un site à la fois immersif **et** conforme RGAA a un différenciateur crédible auprès du jury Developer et auprès de tes clients (audit RGAA).

---

## 8. Matrice « emprunter / adapter / refuser »

| Pratique observée | Source | Décision | Détail |
|---|---|---|---|
| Une phrase par écran | Arc'teryx | **Emprunter** | Phrase d'étape dans le HTML |
| Numérotation I–V + progression | Arc'teryx | **Emprunter** | Étapes + altimètre en HUD textuel |
| Médias chargés par chapitre | Arc'teryx | **Emprunter** | Assets 3D par étape |
| Bannière de consentement plein écran | Arc'teryx | **Refuser** | Aucun suivi invasif |
| Vidéo d'ambiance sans pause | Arc'teryx | **Adapter** | Bouton pause toujours visible (existe déjà), vue statique |
| Compression Draco / KTX2 | Immersive Garden | **Emprunter** | Priorité technique |
| Section « Backstage » | Immersive Garden | **Emprunter** | Page « Coulisses » |
| Showcase de 18 projets | Immersive Garden | **Adapter** | 4 à 5 projets phares complets plutôt que 18 |
| Zoom bloqué | IG, Resn | **Refuser** | Zoom autorisé |
| Images sans `alt`, pas de `main` | IG | **Refuser** | Sémantique complète |
| Un objet signature | Resn | **Emprunter** | La montre |
| Maintenir-appuyer | Resn | **Adapter** | Avec équivalent clavier |
| Contenu dans le canvas | Resn | **Refuser** | HTML d'abord |
| Son d'ambiance | Resn | **Adapter** | Coupé par défaut |
| 20 Mo+ à la charge | IG, Resn | **Refuser** | Budget section 9 |

---

## 9. Budget de performance et d'accessibilité **[proposition]**

Ces cibles sont **ma recommandation**, à valider avec Lighthouse :

| Mesure | Cible proposée | Point de départ (mesuré) |
|---|---|---|
| Transfert avant interaction | ≤ 0,8 Mo | ≈ 0,55 Mo |
| Transfert total après la visite guidée complète | ≤ 6 Mo | non mesuré |
| LCP mobile (4G simulée) | ≤ 2,5 s | ≈ 2,4 s (bureau) |
| CLS | ≤ 0,05 | ≈ 0,005 |
| INP | ≤ 200 ms | non mesuré |
| Modèle 3D le plus lourd | ≤ 2 Mo compressé | non mesuré |
| Textes alternatifs, repères, `lang` | 100 % | ✔ |
| Zoom utilisateur | toujours autorisé | ✔ |
| Mouvement réduit | tout effet continu coupé | ✔ (38 règles) |
| Pause visible pour toute animation > 5 s | oui | ✔ (bouton Pause) |

---

## 10. Plan d'application en trois sprints **[proposition]**

### Sprint 1 — Narration (1 semaine)
- Numéroter les étapes I à V, ajouter la progression textuelle (« Étape n/5 »), une phrase par étape dans le HTML.
- Réduire l'accueil à : accroche → étapes → 3 projets phares → offre → contact.
- Page ou dialogue « Coulisses » (4 décisions techniques).

### Sprint 2 — Matière et geste (1–2 semaines)
- Donner à la montre un moment fort par étape (transformation, lumière).
- Faire de « Dénouer la corde » le geste signature, avec équivalent clavier.
- Ambiance sonore optionnelle (coupée par défaut), icône persistante.

### Sprint 3 — Technique et preuve (1 semaine)
- Compression Draco/Meshopt + KTX2, chargement par étape, mesure du poids après visite guidée.
- Lighthouse mobile + desktop, axe sur toutes les scènes, consignation des scores.
- Dossier de soumission Awwwards : vidéo de 20 s, 5 captures, texte des choix techniques.

---

## 11. Risques et points de vigilance

1. **Copier la forme, pas le fond.** Les trois sites servent une marque ou une agence ; ton site vend un savoir-faire d'accessibilité. Toute mise en scène doit rester vérifiable par un lecteur d'écran.
2. **Poids.** Chaque effet doit justifier son coût ; la barre des 20 Mo ne doit pas devenir ton référentiel.
3. **Droits.** Ne reproduis ni maquettes, ni assets, ni modèles 3D, ni textes de ces sites : inspire-toi des principes (rythme, hiérarchie, interaction), pas des fichiers.
4. **Mobile.** Aucun des trois n'a été testé sur mobile ici ; The Extraordinary Lab (Immersive Garden) présente la performance mobile comme contrainte de base **[source]** : fais de même avant d'ajouter des effets.
5. **Mesures à confirmer.** Voir section 0 : une charge, bureau, WebGL 1.0.

---

## 12. Sources

- Arc'teryx, page System 0 (mesures du 13/11/2026) : https://arcteryx.com/us/en/explore/system0/
- Arc'teryx System 0, lancement (août 2026) : https://bernama.com/en/press/news.php?id=2599487 · https://www.amersports.com/newsroom/arcteryx-introduces-system-0-a-new-framework-for-circular-design/ · https://fashionunited.com/news/fashion/arcteryx-launches-system-0-a-new-framework-for-circular-design/2026082774308
- Immersive Garden, site (mesures du 13/11/2026) : https://immersive-g.com/
- Immersive Garden, étude de cas du nouveau site (Three.js, Blender/Houdini/ZBrush, Vue.js et Nuxt, Backstage) : https://www.awwwards.com/case-study-immersive-gardens-new-website.html
- Immersive Garden, Watches & Wonders (Three.js, GSAP, Lenis, Web Audio API) : https://www.awwwards.com/watches-wonders-immersive-experience-for-cartier.html
- Immersive Garden, Audemars Piguet (performance mobile comme contrainte) : https://www.awwwards.com/gq-audemars-piguet-the-extraordinary-lab.html
- Immersive Garden, Orano (30 modèles 3D, 3,7 Mo / 901 Ko compressés) : https://www.awwwards.com/orano-from-immersive-garden-wins-site-of-the-month-novemeber.html
- Immersive Garden, ATEN7 Site du mois (juillet 2023) : https://awwwards.com/aten7-by-immersive-garden-wins-sotm-july-2023.html
- Resn, site (mesures du 13/11/2026) : https://www.resn.co.nz/
- Resn, Pioneer – Corn Revolutionized (Jelly, Three.js, GSAP, shaders) : https://www.awwwards.com/resns-pioneer-corn-revolutionized-wins-site-of-the-month-july-2020.html
- Resn, Site de l'année Awwwards : https://lbbonline.com/news/resn-and-bader-rutter-win-awwwards-site-of-the-year-for-pioneer-corn-revolutionized
- Resn, entretien Codrops (septembre 2026) : https://tympanus.net/codrops/2026/09/14/inside-resns-digital-experiences/
- Grille Awwwards : https://www.awwwards.com/about-evaluation

## 13. Points à trancher par Adri

1. Veux-tu numéroter les étapes (I–V) et afficher une progression « Étape n/5 » sur l'accueil ?
2. Le geste signature sera-t-il « dénouer la corde » (maintenir) ou un clic simple ?
3. Souhaites-tu une page « Coulisses » publique (décisions techniques, tests) ?
4. Combien de projets phares afficher sur l'accueil (3, 4 ou 5) ?
5. Valides-tu le budget de la section 9 comme engagement public ?
6. Veux-tu un test mobile des trois références sur ton téléphone avant de décider des effets à reprendre ?
