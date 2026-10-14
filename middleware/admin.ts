import { useAuth0 } from "@auth0/auth0-vue";

// /admin est consultable par tous (lecture seule) : pas de connexion forcée.
// On récupère seulement une éventuelle session Auth0 existante pour reconnaître l'admin.
export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return;

  // Composables avant tout `await` : après, le contexte d'injection Vue est perdu.
  const { checkSession } = useAuth0();
  const { isAdmin, refreshRole } = useAdminSession();

  try {
    await checkSession();
  } catch {
    // Pas de session (ou cookies tiers bloqués) : simple visiteur.
  }
  await refreshRole();

  // Les pages de création n'ont rien à montrer en lecture seule : retour à la liste.
  if (!isAdmin.value && to.path.endsWith("/new")) {
    const listPath = to.path.replace(/\/new$/, "");
    return navigateTo(listPath === "/admin/projects" ? "/admin" : listPath, { replace: true });
  }
});
