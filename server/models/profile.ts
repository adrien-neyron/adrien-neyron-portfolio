import mongoose, { Schema, type Document } from "mongoose";

export interface IProfileLocation {
  address?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  countryCode?: string;
  region?: string;
}

export interface IProfileSocial {
  network: string;
  username: string;
  url: string;
  icon?: string;
}

export interface IProfile extends Document {
  name: string;
  label: string;
  email: string;
  phone?: string;
  job1?: string;
  job2?: string;
  description?: string;
  summary?: string;
  headerSubtitle?: string;
  about: string[];
  pictureUrl?: string;
  cvUrl?: string;
  url?: string;
  keywords?: string;
  location: IProfileLocation;
  profiles: IProfileSocial[];
  created_at: Date;
  updated_at: Date;
}

const ProfileSchema = new Schema<IProfile>(
  {
    name:           { type: String, required: true },
    label:          { type: String, default: "" },
    email:          { type: String, required: true },
    phone:          String,
    job1:           String,
    job2:           String,
    description:    String,
    summary:        String,
    headerSubtitle: String,
    about:          { type: [String], default: [] },
    pictureUrl:     String,
    cvUrl:          String,
    url:            String,
    keywords:       String,
    location: {
      address:     String,
      postalCode:  String,
      city:        String,
      country:     String,
      countryCode: String,
      region:      String,
    },
    profiles: [
      {
        network:  String,
        username: String,
        url:      String,
        icon:     String,
      },
    ],
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

export default mongoose.models.Profile
  || mongoose.model<IProfile>("Profile", ProfileSchema);
