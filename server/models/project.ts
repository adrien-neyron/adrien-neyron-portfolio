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
  image?: { light?: string; dark?: string };
  link?: string;
  code?: string;
  difficulty?: string;
  duration?: string;
  category?: string;
  status?: string;
  impact?: string;
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
    link:       String,
    code:       String,
    difficulty: String,
    duration:   String,
    category:   String,
    status:     String,
    impact:     String,
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

export default mongoose.models.Project
  || mongoose.model<IProject>("Project", ProjectSchema);
