<script setup lang="ts">
usePageSeo({
  title: "Mentions légales | Adrien Neyron",
  description: "Mentions légales du site adrien-neyron : éditeur, hébergeur, crédits et données personnelles.",
});
</script>

<template>
  <div class="min-h-screen py-20 px-6 sm:px-12 lg:px-20">
    <article class="max-w-3xl mx-auto legal">
      <p class="font-mono text-xs uppercase tracking-[0.14em] text-[var(--color-accent)] mb-4">Informations légales</p>
      <h1 class="text-3xl sm:text-5xl text-[var(--color-text)] mb-10">Mentions légales</h1>

      <section aria-labelledby="editeur">
        <h2 id="editeur">Éditeur du site</h2>
        <p>
          Adrien Neyron, entrepreneur individuel<br />
          1435 route de la Barliette, 74300 Araches-la-Frasse (France)<br />
          SIRET : 834 362 758 00031<br />
          E-mail : <a href="mailto:adrien.neyron@gmail.com">adrien.neyron@gmail.com</a>
        </p>
      </section>

      <section aria-labelledby="direction">
        <h2 id="direction">Directeur de la publication</h2>
        <p>Adrien Neyron.</p>
      </section>

      <section aria-labelledby="hebergeur">
        <h2 id="hebergeur">Hébergeur</h2>
        <p>
          Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723 (États-Unis) —
          <a href="https://vercel.com" target="_blank" rel="noopener noreferrer">vercel.com<span class="sr-only"> (nouvel onglet)</span></a>.
        </p>
      </section>

      <section aria-labelledby="credits">
        <h2 id="credits">Crédits</h2>
        <p>Les photos d'ambiance des projets viennent d'Unsplash ; le crédit figure sur la fiche du projet concerné. Elles sont chargées depuis images.unsplash.com : votre navigateur contacte donc ce service pour les afficher.</p>
        <p>
          Titres : police « Cormorant Garamond » © The Cormorant Project Authors, licence
          <a href="https://openfontlicense.org/" target="_blank" rel="noopener noreferrer">SIL OFL 1.1<span class="sr-only"> (nouvel onglet)</span></a>,
          hébergée sur ce site.
        </p>
      </section>

      <section aria-labelledby="donnees">
        <h2 id="donnees">Données personnelles</h2>
        <h3>Formulaire de contact</h3>
        <p>
          Les informations saisies (nom, e-mail, message) servent uniquement à répondre à votre demande. Elles sont transmises par le
          service EmailJS à ma messagerie et ne sont ni vendues ni utilisées à d'autres fins. Elles sont conservées le temps nécessaire
          au traitement de votre demande, puis supprimées.
        </p>
        <h3>Météo locale (page d'accueil)</h3>
        <p>
          Pour afficher l'altitude et la météo, votre ville approximative est déduite de votre adresse IP par l'hébergeur (Vercel).
          Seules des coordonnées arrondies (à une dizaine de kilomètres près) sont transmises au service Open-Meteo
          (open-meteo.com), sans votre adresse IP. Aucune de ces données n'est conservée.
        </p>
        <h3>Mesure d'audience</h3>
        <p>Ce site n'utilise ni cookie de suivi ni outil de mesure d'audience.</p>
        <h3>Vos droits</h3>
        <p>
          Vous pouvez demander l'accès, la rectification ou la suppression de vos données en écrivant à
          <a href="mailto:adrien.neyron@gmail.com">adrien.neyron@gmail.com</a>. En cas de désaccord, vous pouvez saisir la CNIL
          (<a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">cnil.fr<span class="sr-only"> (nouvel onglet)</span></a>).
        </p>
      </section>

      <p class="mt-10 text-sm text-[var(--color-muted)]">Dernière mise à jour : 3 novembre 2026.</p>
    </article>
  </div>
</template>

<style scoped>
.legal h2 { font-size: 1.25rem; font-weight: 700; color: var(--color-text); margin: 2.25rem 0 .75rem; }
.legal h3 { font-size: 1rem; font-weight: 600; color: var(--color-text); margin: 1.25rem 0 .4rem; }
.legal p { color: var(--color-text); opacity: .85; line-height: 1.7; margin-bottom: .75rem; }
.legal a { color: var(--color-accent); text-decoration: underline; text-underline-offset: 3px; }
</style>
