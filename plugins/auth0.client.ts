// Auth0 (connexion à /admin) : chargé à la demande, jamais sur l'accueil.
// L'accueil (la boucle) n'en a pas besoin, et le SDK pèse lourd dans le premier affichage :
// on l'installe seulement en arrivant sur une autre page (bouton Admin des réglages, /admin, /callback).
// Le middleware global s'exécute avant le rendu de la page, donc useAuth0() est prêt dans ses composants.
const needsAuth0 = (path: string) => path !== "/";

export default defineNuxtPlugin(async (nuxtApp) => {
  const config = useRuntimeConfig();
  let installed = false;

  const install = async () => {
    if (installed) return;
    installed = true;
    const { createAuth0 } = await import("@auth0/auth0-vue");
    nuxtApp.vueApp.use(
      createAuth0({
        domain:   config.public.auth0Domain,
        clientId: config.public.auth0ClientId,
        authorizationParams: {
          redirect_uri: `${window.location.origin}/callback`,
        },
      })
    );
  };

  if (needsAuth0(window.location.pathname)) await install();
  addRouteMiddleware("auth0-lazy", async (to) => {
    if (needsAuth0(to.path)) await install();
  }, { global: true });
});
