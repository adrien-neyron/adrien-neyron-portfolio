import { dbConnect } from "~/server/lib/mongodb";
import Profile from "~/server/models/profile";
import Project from "~/server/models/project";
import CarnetArticle from "~/server/models/carnetArticle";
import AiTool from "~/server/models/aiTool";

/**
 * Contenu éditable de l'accueil « L'ascension », agrégé depuis l'admin (/admin).
 *
 * Le balisage de la boucle (assets/loop/loop.html) reste la version de référence : il s'affiche
 * sans JavaScript et sert de repli. Ce point d'entrée ne renvoie que ce qui est RÉELLEMENT saisi
 * en base ; loop.js remplace alors les textes par défaut correspondants (voir docs/admin-boucle.md).
 * Rien n'est inventé ici : champ vide = on garde le texte par défaut.
 *
 * Réponse mise en cache 60 s côté CDN (stale-while-revalidate 5 min) : une modification dans
 * /admin apparaît sur l'accueil en moins d'une minute.
 */
const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const network = (profiles: { network?: string; url?: string }[] | undefined, re: RegExp) =>
  str((profiles || []).find((p) => re.test(str(p.network)))?.url);

export default defineEventHandler(async (event) => {
  try {
    await dbConnect();
    const [profile, projects, articles, aiTools] = await Promise.all([
      Profile.findOne().lean(),
      Project.find().sort({ order: 1, created_at: 1 }).lean(),
      CarnetArticle.find().sort({ date: -1 }).lean(),
      AiTool.find().lean(),
    ]);

    setHeader(event, "Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    return {
      profile: profile
        ? {
            lead: str(profile.loopLead),
            facts: str(profile.loopFacts),
            cvUrl: str(profile.cvUrl),
          }
        : null,
      hero: profile
        ? { eyebrow: str(profile.loopEyebrow), title: str(profile.loopTitle), lede: str(profile.loopLede) }
        : null,
      dial: profile
        ? {
            name: str(profile.loopDialName),
            role: str(profile.loopDialRole),
            xpLabel: str(profile.loopDialXpLabel),
            xpValue: str(profile.loopDialXpValue),
          }
        : null,
      toolsHead: profile
        ? { eyebrow: str(profile.loopToolsEyebrow), title: str(profile.loopToolsTitle), lede: str(profile.loopToolsLede) }
        : null,
      contact: profile
        ? {
            email: str(profile.email),
            linkedin: network(profile.profiles, /linkedin/i),
            github: network(profile.profiles, /github/i),
            rdv: str(profile.bookingUrl),
          }
        : null,
      projects: projects.map((p) => ({
        slug: str(p.slug),
        title: str(p.title),
        tagline: str(p.tagline),
        role: str(p.role),
        description: str(p.description),
        challenge: str(p.challenge),
        solution: str(p.solution),
        result: str(p.result),
        impact: str(p.impact),
        technologies: (p.technologies || []).map(str).filter(Boolean),
        place: str(p.place),
        startDate: str(p.startDate),
        status: str(p.status),
        category: str(p.category),
        link: str(p.link),
        code: str(p.code),
      })),
      articles: articles.map((a) => ({
        slug: str(a.slug),
        title: str(a.title),
        excerpt: str(a.excerpt),
        category: str(a.category),
        date: str(a.date),
      })),
      aiTools: aiTools.map((t) => ({
        slug: str(t.slug),
        name: str(t.name),
        tagline: str(t.tagline),
        provider: str(t.provider),
      })),
    };
  } catch {
    // base indisponible (plan gratuit en pause…) : l'accueil garde ses textes par défaut
    setHeader(event, "Cache-Control", "no-store");
    return {};
  }
});
