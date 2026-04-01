import mongoose, { Schema, type Document } from "mongoose";

export interface IProject extends Document {
  title: string;
  role: string;
  description: string;
  technologies: string[];
  image?: { light?: string; dark?: string };
  link?: string;
  code?: string;
}

const ProjectSchema = new Schema<IProject>({
  title:        { type: String, required: true },
  role:         { type: String, required: true },
  description:  { type: String, required: true },
  technologies: { type: [String], required: true },
  image: {
    light: String,
    dark:  String,
  },
  link: String,
  code: String,
});

export default mongoose.models.Project
  || mongoose.model<IProject>("Project", ProjectSchema);
