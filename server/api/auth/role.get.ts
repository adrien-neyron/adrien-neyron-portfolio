import { isAdminRequest } from "~/server/utils/requireAuth";

/**
 * Rôle dans /admin : `admin` (édition) ou `lecteur` (consultation seule).
 * Public : l'admin est consultable par tous, seul ADMIN_EMAIL peut écrire.
 */
export default defineEventHandler(async (event) => ({
  role: (await isAdminRequest(event)) ? "admin" : "lecteur",
}));
