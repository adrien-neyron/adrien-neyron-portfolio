import mongoose, { Schema, type Document } from "mongoose";

export interface ICarnetArticle extends Document {
  slug: string;
  title: string;
  excerpt?: string;
  category: string;
  date: string;
  cover?: string;
  content: string;
  data?: {
    elevation?: string;
    heartRate?: string;
    pace?: string;
  };
  created_at: Date;
  updated_at: Date;
}

const CarnetArticleSchema = new Schema<ICarnetArticle>(
  {
    slug:     { type: String, required: true, unique: true },
    title:    { type: String, required: true },
    excerpt:  { type: String, default: "" },
    category: { type: String, default: "Dev" },
    date:     { type: String, required: true },
    cover:    String,
    content:  { type: String, default: "" },
    data: {
      elevation: String,
      heartRate: String,
      pace:      String,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

export default mongoose.models.CarnetArticle
  || mongoose.model<ICarnetArticle>("CarnetArticle", CarnetArticleSchema);
