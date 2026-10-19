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
  heroTitle?: string;
  job1?: string;
  job2?: string;
  description?: string;
  summary?: string;
  headerSubtitle?: string;
  about: string[];
  pictureUrl?: string;
  cvUrl?: string;
  bookingUrl?: string;   // lien de prise de rendez-vous (bouton du Bivouac)
  loopLead?: string;     // accueil : accroche de la fiche « Le Randonneur »
  loopFacts?: string;    // accueil : ligne de faits de la fiche « Le Randonneur »
  loopEyebrow?: string;  // accueil : surtitre au-dessus du titre
  loopTitle?: string;    // accueil : titre (h1) et accroche de l'écran de la corde
  loopLede?: string;     // accueil : sous-texte sous le titre
  loopDialName?: string;   // accueil : nom affiché sur le cadran de la montre
  loopDialRole?: string;   // accueil : ligne de titre du cadran
  loopDialXpLabel?: string; // accueil : libellé de l'expérience (cadran)
  loopDialXpValue?: string; // accueil : valeur de l'expérience (cadran)
  loopToolsEyebrow?: string; // accueil, étape « S'équiper » : surtitre
  loopToolsTitle?: string;   // accueil, étape « S'équiper » : titre
  loopToolsLede?: string;    // accueil, étape « S'équiper » : paragraphe
  trailStats?: { value: string; label: string }[]; // bandeau de chiffres sous le titre de /projects
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
    heroTitle:      String,
    job1:           String,
    job2:           String,
    description:    String,
    summary:        String,
    headerSubtitle: String,
    about:          { type: [String], default: [] },
    pictureUrl:     String,
    cvUrl:          String,
    bookingUrl:     String,
    loopLead:       String,
    loopFacts:      String,
    loopEyebrow:    String,
    loopTitle:      String,
    loopLede:       String,
    loopDialName:   String,
    loopDialRole:   String,
    loopDialXpLabel: String,
    loopDialXpValue: String,
    loopToolsEyebrow: String,
    loopToolsTitle: String,
    loopToolsLede:  String,
    trailStats:     { type: [{ value: String, label: String, _id: false }], default: undefined },
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
