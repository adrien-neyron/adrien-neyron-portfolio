import { dbConnect } from "~/server/lib/mongodb";
import Project from "~/server/models/project";
import CarnetArticle from "~/server/models/carnetArticle";
import { isListedProject, projectHref } from "~/utils/stages";

/**
 * sitemap.xml : pages fixes + fiches projet publiées (mêmes critères que /projects : isListedProject)
 * + articles du carnet qui ont un slug. Si la base est indisponible, seules les pages fixes sont listées.
 */
const STATIC_PATHS = ["/", "/projects", "/about", "/carnet", "/ai-tools", "/contact", "/outils/allure-denivele", "/mentions-legales", "/accessibilite"];

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export default defineEventHandler(async (event) => {
  const site = (process.env.SITE_URL || "https://adrien-neyron-portfolio.vercel.app").replace(/\/$/, "");
  const paths = [...STATIC_PATHS];

  try {
    await dbConnect();
    const [projects, articles] = await Promise.all([
      Project.find().lean(),
      CarnetArticle.find().lean(),
    ]);
    for (const p of projects as any[]) {
      const slug = p.slug || String(p._id);
      if (isListedProject({ ...p, slug })) paths.push(projectHref(slug));
    }
    for (const a of articles as any[]) {
      if (typeof a.slug === "string" && a.slug) paths.push(`/carnet/${encodeURIComponent(a.slug)}`);
    }
  } catch (err) {
    console.error("[sitemap] base indisponible, pages fixes uniquement :", err);
  }

  setHeader(event, "Content-Type", "application/xml; charset=utf-8");
  setHeader(event, "Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
  const urls = [...new Set(paths)].map((p) => `  <url><loc>${esc(site + p)}</loc></url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
});
