/**
 * robots.txt généré : l'URL du site vient de SITE_URL (variable d'environnement), pour que le jour du
 * passage au domaine propre, le sitemap annoncé suive sans toucher au code.
 */
export default defineEventHandler((event) => {
  const site = (process.env.SITE_URL || "https://adrien-neyron-portfolio.vercel.app").replace(/\/$/, "");
  setHeader(event, "Content-Type", "text/plain; charset=utf-8");
  setHeader(event, "Cache-Control", "public, s-maxage=3600");
  return [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin",
    "Disallow: /api/",
    "Disallow: /callback",
    "",
    `Sitemap: ${site}/sitemap.xml`,
    "",
  ].join("\n");
});
