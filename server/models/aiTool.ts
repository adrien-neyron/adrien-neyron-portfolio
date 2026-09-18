import mongoose, { Schema, type Document } from "mongoose";

export interface IAiTool extends Document {
  slug: string;
  name: string;
  provider?: string;
  category: string;
  tagline?: string;
  description?: string;
  useCases: string[];
  businessValue?: string;
  icon?: string;
  link?: string;
  created_at: Date;
  updated_at: Date;
}

const AiToolSchema = new Schema<IAiTool>(
  {
    slug:          { type: String, required: true, unique: true },
    name:          { type: String, required: true },
    provider:      String,
    category:      { type: String, default: "" },
    tagline:       String,
    description:   String,
    useCases:      { type: [String], default: [] },
    businessValue: String,
    icon:          String,
    link:          String,
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

export default mongoose.models.AiTool
  || mongoose.model<IAiTool>("AiTool", AiToolSchema);
