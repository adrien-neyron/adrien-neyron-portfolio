import type { StageIssue } from "~/utils/stages";

/** Erreur renvoyée par $fetch / h3 (forme minimale). */
export interface ApiErrorLike {
  statusCode?: number;
  status?: number;
  statusMessage?: string;
  data?: { statusCode?: number; statusMessage?: string; data?: { errors?: StageIssue[] } };
  message?: string;
}

/**
 * Message affichable pour une erreur d'API de l'admin : dit ce qui s'est passé et quoi faire,
 * jamais un simple « Erreur ». `what` complète la phrase (« créer l'étape »).
 */
export function apiErrorMessage(e: unknown, what: string): { message: string; issues: StageIssue[] } {
  const err = (e ?? {}) as ApiErrorLike;
  const code = err.statusCode ?? err.status ?? err.data?.statusCode;
  const issues = err.data?.data?.errors ?? [];
  const detail = err.data?.statusMessage || err.statusMessage;
  if (code === 401) return { issues, message: `Impossible de ${what} : ta session a expiré. Reconnecte-toi puis réessaie.` };
  if (code === 403) return { issues, message: `Impossible de ${what} : ce compte n'a pas le droit d'écrire (seul l'administrateur le peut).` };
  if (code === 404) return { issues, message: `Impossible de ${what} : l'étape n'existe plus. Retourne à la liste et recharge-la.` };
  if (code === 409) return { issues, message: `Impossible de ${what} : ${detail || "cette clé est déjà utilisée"}. Change la clé et réessaie.` };
  if (code === 422 || code === 400) return { issues, message: `Impossible de ${what} : ${issues.length ? "corrige les points ci-dessous." : detail || "des champs sont invalides."}` };
  if (code && code >= 500) return { issues, message: `Impossible de ${what} : le serveur a rencontré une erreur (${code}). La base de données est peut-être en pause ; réessaie dans un instant.` };
  if (!code) return { issues, message: `Impossible de ${what} : le serveur ne répond pas. Vérifie ta connexion puis réessaie.` };
  return { issues, message: `Impossible de ${what} (erreur ${code}${detail ? ` — ${detail}` : ""}).` };
}
