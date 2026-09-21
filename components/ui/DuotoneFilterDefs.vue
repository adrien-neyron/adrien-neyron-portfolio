<template>
  <!--
    Défs de filtre SVG "duotone" partagées par toutes les vignettes de
    projet (voir la classe .duotone-image dans assets/css/main.css et son
    usage dans components/ui/ProjectCard.vue). Monté une seule fois ici,
    dans layouts/default.vue : un filtre référencé via `filter: url(#id)`
    doit simplement exister quelque part dans le DOM de la page, pas
    forcément à côté de chaque image qui l'utilise.

    Le traitement est calculé "à la volée" par le navigateur (feColorMatrix
    + feComponentTransfer) sur l'image d'origine, quelle qu'elle soit —
    aucune image n'est regénérée ni stockée : ça marche automatiquement
    avec toute capture d'écran importée depuis l'admin.

    1. feColorMatrix convertit l'image en niveaux de gris (pondération de
       luminance Rec. 709, la même que celle utilisée par les navigateurs
       et outils d'accessibilité pour calculer un ratio de contraste).
    2. feComponentTransfer reprojette ce niveau de gris entre deux teintes
       de la charte "Camp de Base" : les ombres vers --color-secondary
       (sauge foncée, #3C5C3A) et les lumières vers --color-highlight
       (ambre, #E8A838). Valeurs figées (indépendantes du mode sombre) :
       c'est un traitement photo volontairement constant, comme un rendu
       argentique — pas une couleur d'interface.

    Purement décoratif et invisible (0×0, hors flux) : aucun contenu,
    aria-hidden par sécurité pour les technologies d'assistance.
  -->
  <svg
    aria-hidden="true"
    focusable="false"
    width="0"
    height="0"
    style="position: absolute; overflow: hidden"
  >
    <defs>
      <filter id="duotone-trail" color-interpolation-filters="sRGB">
        <feColorMatrix
          type="matrix"
          values="0.2126 0.7152 0.0722 0 0
                  0.2126 0.7152 0.0722 0 0
                  0.2126 0.7152 0.0722 0 0
                  0      0      0      1 0"
        />
        <feComponentTransfer>
          <feFuncR type="table" tableValues="0.235 0.910" />
          <feFuncG type="table" tableValues="0.361 0.659" />
          <feFuncB type="table" tableValues="0.227 0.220" />
        </feComponentTransfer>
      </filter>
    </defs>
  </svg>
</template>
