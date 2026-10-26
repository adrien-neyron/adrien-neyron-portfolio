import mongoose, { Schema, type Document } from "mongoose";

/** Étape de la trace de l'accueil (voir utils/stages.ts et docs/admin-boucle.md). */
export interface IStage extends Document {
  key: string;
  order: number;
  kind: "depart" | "etape" | "bivouac" | "final";
  period: string;
  title: string;
  place?: string;
  summary?: string;
  figure?: string;        // vide : l'étape s'affiche sans chiffre
  figureLabel?: string;
  projects: string[];     // slugs des fiches liées
  created_at: Date;
  updated_at: Date;
}

const StageSchema = new Schema<IStage>(
  {
    key:         { type: String, required: true, unique: true },
    order:       { type: Number, default: 0 },
    kind:        { type: String, enum: ["depart", "etape", "bivouac", "final"], default: "etape" },
    period:      { type: String, default: "" },
    title:       { type: String, required: true },
    place:       String,
    summary:     String,
    figure:      String,
    figureLabel: String,
    projects:    { type: [String], default: [] },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export default mongoose.models.Stage || mongoose.model<IStage>("Stage", StageSchema);
