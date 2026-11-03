<script setup lang="ts">
usePageSeo({
  title: "Déclaration d'accessibilité | Adrien Neyron",
  description: "Déclaration d'accessibilité du site adrien-neyron : objectif RGAA 4.1 / WCAG 2.1 AA, état des contrôles, contact.",
});
</script>

<template>
  <div class="min-h-screen py-20 px-6 sm:px-12 lg:px-20">
    <article class="max-w-3xl mx-auto legal">
      <p class="font-mono text-xs uppercase tracking-[0.14em] text-[var(--color-accent)] mb-4">Accessibilité numérique</p>
      <h1 class="text-3xl sm:text-5xl text-[var(--color-text)] mb-10">Déclaration d'accessibilité</h1>

      <p>
        Adrien Neyron s'engage à rendre ce site accessible, conformément à l'article 47 de la loi n° 2005-102 du 11 février 2005.
        Le site vise le niveau AA des WCAG 2.1 et le RGAA 4.1.
      </p>

      <section aria-labelledby="etat">
        <h2 id="etat">État de conformité</h2>
        <p>
          Le site n'a pas encore fait l'objet d'un audit RGAA complet : son état de conformité n'est donc pas évalué à ce jour.
          Un audit sera réalisé et cette déclaration mise à jour avec le taux de conformité.
        </p>
      </section>

      <section aria-labelledby="controles">
        <h2 id="controles">Contrôles réalisés</h2>
        <ul>
          <li>Tests automatisés (axe-core, règles WCAG 2.1 A et AA) sur chaque page publique, en mode clair et en mode sombre, à chaque livraison.</li>
          <li>Navigation au clavier, lien d'évitement, focus visible et cibles d'au moins 44 px contrôlés pendant le développement.</li>
        </ul>
      </section>

      <section aria-labelledby="mesures">
        <h2 id="mesures">Ce qui est mis en place</h2>
        <ul>
          <li>Tout le contenu est en texte ; la 3D et les décors sont ignorés par les lecteurs d'écran.</li>
          <li>Un plan de navigation permet d'atteindre chaque scène de l'accueil au clavier.</li>
          <li>Boutons « Pause », « Vue statique » et « Mode nuit ». La vue statique s'active seule si votre appareil demande moins d'animations.</li>
          <li>Après un changement de page, le focus est placé sur le titre et le nouveau titre est annoncé.</li>
        </ul>
      </section>

      <section aria-labelledby="limites">
        <h2 id="limites">Défauts connus</h2>
        <p>Quelques éléments de certaines pages n'atteignent pas encore le rapport de contraste minimal (4,5:1 pour le texte). Leur correction est en cours.</p>
      </section>

      <section aria-labelledby="contact">
        <h2 id="contact">Signaler un problème</h2>
        <p>
          Si vous rencontrez un défaut d'accessibilité, écrivez à
          <a href="mailto:adrien.neyron@gmail.com">adrien.neyron@gmail.com</a> en précisant la page et votre outil d'assistance. Je réponds sous 48 h.
        </p>
      </section>

      <section aria-labelledby="recours">
        <h2 id="recours">Voie de recours</h2>
        <p>
          Sans réponse satisfaisante, vous pouvez saisir le Défenseur des droits :
          <a href="https://formulaire.defenseurdesdroits.fr" target="_blank" rel="noopener noreferrer">formulaire.defenseurdesdroits.fr<span class="sr-only"> (nouvel onglet)</span></a>.
        </p>
      </section>

      <p class="mt-10 text-sm text-[var(--color-muted)]">Établie le 3 novembre 2026.</p>
    </article>
  </div>
</template>

<style scoped>
.legal h2 { font-size: 1.25rem; font-weight: 700; color: var(--color-text); margin: 2.25rem 0 .75rem; }
.legal p { color: var(--color-text); opacity: .85; line-height: 1.7; margin-bottom: .75rem; }
.legal ul { list-style: disc; padding-left: 1.25rem; color: var(--color-text); opacity: .85; line-height: 1.7; }
.legal li { margin-bottom: .4rem; }
.legal a { color: var(--color-accent); text-decoration: underline; text-underline-offset: 3px; }
</style>
