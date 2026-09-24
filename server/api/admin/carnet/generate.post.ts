import { requireAdminWrite } from "~/server/utils/requireAuth";
import { GoogleGenAI } from "@google/genai";

interface GenerateBody {
  mode: "draft" | "improve";
  category?: "Trail" | "Dev" | "Coulisses";
  topic?: string;
  notes?: string;
  existingContent?: string;
  instruction?: string;
}

// Modèle Gemini gratuit (clé gratuite sur aistudio.google.com/apikey, pas de
// carte bancaire requise) — voir CLAUDE.md pour le choix vs. Claude/Groq.
// "gemini-flash-latest" est un alias documenté par Google qui suit toujours
// le Flash courant (évite de repointer ce fichier à chaque nouvelle version —
// la numérotation Gemini a déjà bougé plusieurs fois en 2026), plutôt qu'une
// version épinglée comme "gemini-2.5-flash" dont l'accès est restreint aux
// comptes l'ayant déjà utilisée par le passé.
const MODEL = "gemini-flash-latest";

// Voix du site — voir assets/css/main.css / CLAUDE.md pour le ton "trail/dev"
// du Carnet. Le corps est rendu tel quel via ContentRenderer-like markdown
// simple côté front (pages/carnet/[slug].vue), donc pas de frontmatter ni
// de titre h1 dans le texte généré : le titre/l'accroche sont des champs
// séparés du formulaire.
const SYSTEM_PROMPT = `Tu rédiges pour "Le Carnet", le blog du portfolio d'Adrien Neyron — développeur Vue.js/Nuxt spécialisé en accessibilité (WCAG/RGAA), et traileur. Le ton est direct, personnel, à la première personne, sans emphase publicitaire ni superlatifs creux. Écris exclusivement en français.

Le corps de l'article est du Markdown : utilise des titres de niveau 2 (##) ou 3 (###) pour structurer, des paragraphes courts, des listes si utile. N'inclus JAMAIS de titre de niveau 1 (#) ni de frontmatter — le titre est géré séparément par le formulaire. Longueur cible : 400 à 700 mots.`;

function parseJsonResponse(raw: string): { title: string; excerpt: string; content: string } {
  // Retire d'éventuelles balises ```json … ``` autour de la réponse
  // (Gemini suit bien responseMimeType: "application/json", mais on reste
  // défensif comme pour les autres fournisseurs testés).
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (typeof parsed.title !== "string" || typeof parsed.content !== "string") {
      throw new Error("missing fields");
    }
    return {
      title: parsed.title,
      excerpt: typeof parsed.excerpt === "string" ? parsed.excerpt : "",
      content: parsed.content,
    };
  } catch {
    throw createError({
      statusCode: 502,
      statusMessage: "L'IA a renvoyé une réponse illisible — réessaie, ou reformule le sujet.",
    });
  }
}

export default defineEventHandler(async (event) => {
  await requireAdminWrite(event);

  const body = await readBody<GenerateBody>(event);
  const config = useRuntimeConfig();

  if (!config.geminiApiKey) {
    throw createError({
      statusCode: 500,
      statusMessage:
        "GEMINI_API_KEY manquante — crée une clé gratuite sur aistudio.google.com/apikey, puis ajoute-la dans les variables d'environnement Vercel (et dans ton .env en local).",
    });
  }

  const ai = new GoogleGenAI({ apiKey: config.geminiApiKey as string });

  if (body.mode === "draft") {
    const topic = body.topic?.trim();
    if (!topic) {
      throw createError({ statusCode: 400, statusMessage: "Le sujet est requis pour générer un brouillon." });
    }

    const userPrompt = `Sujet de l'article : ${topic}
Catégorie : ${body.category ?? "Dev"}
${body.notes?.trim() ? `Notes / points à couvrir :\n${body.notes.trim()}` : ""}

Réponds STRICTEMENT avec un objet JSON valide, sans aucun texte avant ou après, au format exact :
{"title": "titre de l'article", "excerpt": "accroche d'une phrase, 160 caractères max", "content": "corps de l'article en Markdown"}`;

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: userPrompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.8,
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
      },
    });

    return parseJsonResponse(response.text?.trim() ?? "");
  }

  if (body.mode === "improve") {
    const existingContent = body.existingContent?.trim();
    if (!existingContent) {
      throw createError({ statusCode: 400, statusMessage: "Aucun texte à améliorer." });
    }

    const userPrompt = `Voici un brouillon d'article (Markdown) :

${existingContent}

Consigne : ${body.instruction?.trim() || "améliore le style et la clarté, corrige la grammaire, sans changer le sens ni la longueur globale."}

Réponds UNIQUEMENT avec le texte Markdown amélioré, sans commentaire, sans balises de code autour, sans titre de niveau 1.`;

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: userPrompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.6,
        maxOutputTokens: 2048,
      },
    });

    return { content: response.text?.trim() ?? "" };
  }

  throw createError({ statusCode: 400, statusMessage: "mode invalide (attendu: draft ou improve)." });
});
