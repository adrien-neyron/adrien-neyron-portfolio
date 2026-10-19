import mongoose, { Schema, type Document } from "mongoose";

export interface IProject extends Document {
  slug: string;
  title: string;
  tagline?: string;
  role: string;
  description: string;
  challenge?: string;
  solution?: string;
  result?: string;
  technologies: string[];
  image?: { light?: string; dark?: string };        // capture d'écran (affichée nette sur la fiche)
  // Photo d'ambiance « grain skate » (cartes + en-tête de fiche) et son crédit
  cover?: string;
  coverCredit?: string;                             // « Imthaz Ahamed / Unsplash »
  coverCreditUrl?: string;
  // Origine de la photo — voir server/utils/projectCover.ts (priorité admin > Unsplash)
  coverSource?: "admin" | "unsplash";
  coverUnsplashId?: string;                         // id Unsplash (évite de reproposer la même photo)
  coverQuery?: string;                              // mots-clés de recherche (modifiables dans /admin)
  coverCheckedAt?: Date;                            // dernière recherche auto (pas de relance avant 24 h)
  link?: string;
  code?: string;
  difficulty?: string;
  duration?: string;
  category?: string;
  status?: string;
  impact?: string;
  // Refonte « L'ascension » — fiche topo (tous optionnels, rétrocompatibles)
  type?: "mission" | "perso";                     // filtre « Missions / Projets perso » de /projects ; vide → repli DEFAULT_PROJECT_TYPES (utils/stages.ts)
  order?: number;                                  // rang sur le parcours de l'accueil (0 = premier) ; vide : ordre de création
  place?: string;                                  // « Lyon », « Paris »…
  coords?: { lat?: number; lon?: number };          // coordonnées affichées sur la fiche
  startDate?: string;                               // « Mai 2026 »
  profile?: number[];                               // profil d'altitude 0-100 ; vide → profil généré
  milestones?: { label: string; detail?: string }[]; // étapes sur le profil
  stats?: { value: string; label: string }[];       // chiffres clés de « Arrivée »
  created_at: Date;
  updated_at: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    slug:         { type: String, required: true, unique: true },
    title:        { type: String, required: true },
    tagline:      String,
    role:         { type: String, default: "" },
    description:  { type: String, default: "" },
    challenge:    String,
    solution:     String,
    result:       String,
    technologies: { type: [String], default: [] },
    image: {
      light: String,
      dark:  String,
    },
    cover:          String,
    coverCredit:    String,
    coverCreditUrl: String,
    coverSource:     { type: String, enum: ["admin", "unsplash"] },
    coverUnsplashId: String,
    coverQuery:      String,
    coverCheckedAt:  Date,
    link:       String,
    code:       String,
    difficulty: String,
    duration:   String,
    category:   String,
    status:     String,
    impact:     String,
    type:       { type: String, enum: ["mission", "perso"] },
    order:      Number,
    place:      String,
    coords: {
      lat: Number,
      lon: Number,
    },
    startDate:  String,
    profile:    { type: [Number], default: undefined },
    milestones: { type: [{ label: String, detail: String, _id: false }], default: undefined },
    stats:      { type: [{ value: String, label: String, _id: false }], default: undefined },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

export default mongoose.models.Project
  || mongoose.model<IProject>("Project", ProjectSchema);
