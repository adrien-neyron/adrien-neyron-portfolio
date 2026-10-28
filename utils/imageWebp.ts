/**
 * Conversion des images envoyées depuis l'admin en WebP (plus léger, et sous la limite de 4,5 Mo des fonctions Vercel).
 * Les fonctions pures sont testées (tests/unit/imageWebp.test.ts) ; `convertToWebp` a besoin du navigateur (canvas).
 */
export const WEBP_MAX_SIDE = 1600;
export const WEBP_QUALITY = 0.82;
/** Formats raster convertis. SVG (vectoriel) et GIF (animé) sont envoyés tels quels. */
export const CONVERTIBLE = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/bmp"];

export const isConvertible = (type: string) => CONVERTIBLE.includes(type);

/** Dimensions réduites pour que le grand côté ne dépasse pas `max` (jamais agrandi). */
export function fitSize(w: number, h: number, max = WEBP_MAX_SIDE): { width: number; height: number } {
  const k = Math.min(1, max / Math.max(w, h, 1));
  return { width: Math.max(1, Math.round(w * k)), height: Math.max(1, Math.round(h * k)) };
}

/** « Photo Été.JPG » → « photo-ete.webp » */
export function webpName(name: string): string {
  const base = name.replace(/\.[^.]+$/, "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return `${base || "image"}.webp`;
}

export const formatKo = (bytes: number) => (bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} Mo` : `${Math.max(1, Math.round(bytes / 1024))} Ko`);

/** Convertit une image en WebP (redimensionnée). Renvoie le fichier d'origine si le format n'est pas convertible ou si le navigateur ne sait pas encoder en WebP. */
export async function convertToWebp(file: File, max = WEBP_MAX_SIDE, quality = WEBP_QUALITY): Promise<File> {
  if (!isConvertible(file.type)) return file;
  const bmp = await createImageBitmap(file);
  const { width, height } = fitSize(bmp.width, bmp.height, max);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) { bmp.close?.(); return file; }
  ctx.drawImage(bmp, 0, 0, width, height);
  bmp.close?.();
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/webp", quality));
  if (!blob || blob.type !== "image/webp") return file;   // encodage WebP non pris en charge : on garde l'original
  if (file.type === "image/webp" && blob.size >= file.size && width === bmp.width) return file;
  return new File([blob], webpName(file.name), { type: "image/webp" });
}
