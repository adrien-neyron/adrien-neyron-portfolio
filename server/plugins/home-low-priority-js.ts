/**
 * Accueil (la boucle) : le JavaScript de Nuxt démarre juste après le premier affichage.
 * Rien n'y est interactif avant la première interaction du visiteur (c'est elle qui charge la 3D, voir
 * components/loop/LoopHome.vue) : le HTML, ses styles et les polices du premier écran passent donc d'abord,
 * au lieu de partager la bande passante avec ~100 Ko de JS (Lighthouse mobile : FCP / LCP).
 * - les <link rel="modulepreload"> sont retirés (les modules se chargent quand même, à la demande du point d'entrée) ;
 * - le <script type="module"> d'entrée est ajouté par un petit script après l'événement load (premier écran et
 *   polices affichés) ;
 * - ce petit script note aussi un geste précoce du visiteur (window.__loopWake) : si on touche ou fait défiler
 *   avant que Vue soit prêt, la 3D démarre dès le montage de LoopHome au lieu d'attendre un second geste.
 * Les autres pages ne sont pas touchées.
 */
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook("render:html", (html, { event }) => {
    if (event.path.split("?")[0] !== "/") return;
    const defer = (s: string) =>
      s
        .replace(/<link rel="modulepreload"[^>]*>/g, "")
        .replace(/<script type="module" src="([^"]+)"[^>]*><\/script>/g, (_, src: string) =>
          `<script>(function(){var w=["pointermove","pointerdown","touchstart","wheel","scroll","keydown"],f=function(){window.__loopWake=1;w.forEach(function(t){removeEventListener(t,f)})};w.forEach(function(t){addEventListener(t,f,{passive:true})});` +
          `function go(){setTimeout(function(){var s=document.createElement("script");s.type="module";s.crossOrigin="";s.src=${JSON.stringify(src)};document.head.appendChild(s)})}` +
          `document.readyState==="complete"?go():addEventListener("load",go)})()</script>`);
    html.head = html.head.map(defer);
    html.bodyAppend = html.bodyAppend.map(defer);
  });
});
