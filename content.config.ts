import { defineCollection, defineContentConfig, z } from "@nuxt/content";

export default defineContentConfig({
  collections: {
    carnet: defineCollection({
      type: "page",
      source: "carnet/*.md",
      schema: z.object({
        title: z.string(),
        excerpt: z.string(),
        category: z.enum(["Trail", "Dev", "Coulisses"]),
        date: z.string(),
        cover: z.string().optional(),
        // Bloc de données optionnel — utile pour un article de type "sortie trail"
        // (dénivelé, fréquence cardiaque moyenne, allure), laissé de côté sinon.
        data: z
          .object({
            elevation: z.string().optional(),
            heartRate: z.string().optional(),
            pace: z.string().optional(),
          })
          .optional(),
      }),
    }),
  },
});
