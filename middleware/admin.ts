import { useAuth0 } from "@auth0/auth0-vue";

export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return;

  const { isAuthenticated, checkSession, loginWithRedirect } = useAuth0();

  await checkSession();

  if (!isAuthenticated.value) {
    await loginWithRedirect({
      appState: { target: to.fullPath },
    });
    return abortNavigation();
  }
});
