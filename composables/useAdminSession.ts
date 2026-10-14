import { useAuth0 } from "@auth0/auth0-vue";

/**
 * Session /admin : tout le monde peut consulter le backoffice, seul l'admin
 * (ADMIN_EMAIL, vérifié par le serveur via /api/auth/role) peut modifier.
 * `isAdmin` ne pilote que l'interface : chaque écriture reste refusée côté
 * serveur par requireAdminWrite, quoi qu'affiche le navigateur.
 */
type Entity = "projects" | "carnet" | "ai-tools";
type Role = "admin" | "lecteur";

// Même ordre que les routes /api/admin/* (plus récent d'abord).
const SORT_KEY: Record<Entity, string> = { projects: "created_at", carnet: "date", "ai-tools": "created_at" };

export function useAdminSession() {
  const auth0 = useAuth0();
  const role = useState<Role>("admin-role", () => "lecteur");
  const checkedToken = useState<string>("admin-role-token", () => "");

  const isAdmin = computed(() => role.value === "admin");
  const isAuthenticated = computed(() => auth0.isAuthenticated.value);
  const getToken = () => (auth0.idTokenClaims.value as { __raw?: string })?.__raw ?? "";
  const authHeaders = () => ({ Authorization: `Bearer ${getToken()}` });

  /** Demande le rôle au serveur, une seule fois par jeton. */
  async function refreshRole() {
    const token = auth0.isAuthenticated.value ? getToken() : "";
    if (token === checkedToken.value) return;
    checkedToken.value = token;
    if (!token) {
      role.value = "lecteur";
      return;
    }
    try {
      role.value = (await $fetch<{ role: Role }>("/api/auth/role", { headers: authHeaders() })).role;
    } catch {
      role.value = "lecteur";
    }
  }

  /** Liste d'une entité : routes admin pour l'admin, routes publiques (mêmes données) pour un visiteur. */
  async function list<T>(entity: Entity): Promise<T[]> {
    if (isAdmin.value) return $fetch<T[]>(`/api/admin/${entity}`, { headers: authHeaders() });
    const rows = await $fetch<Record<string, unknown>[]>(`/api/${entity}`);
    const key = SORT_KEY[entity];
    return rows
      .map((r) => ({ ...r, id: String(r._id) }))
      .sort((a, b) => String(b[key] ?? "").localeCompare(String(a[key] ?? ""))) as T[];
  }

  function login(target = "/admin") {
    return auth0.loginWithRedirect({ appState: { target } });
  }

  function logout() {
    return auth0.logout({ logoutParams: { returnTo: window.location.origin } });
  }

  return { isAdmin, isAuthenticated, getToken, authHeaders, refreshRole, list, login, logout };
}
