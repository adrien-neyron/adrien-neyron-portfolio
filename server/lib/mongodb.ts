import mongoose from "mongoose";

let cached: typeof mongoose | null = null;

export async function dbConnect(): Promise<typeof mongoose> {
  if (cached) return cached;

  const config = useRuntimeConfig();
  const uri = config.mongodbUri;

  if (!uri) throw new Error("MONGODB_URI manquante dans les variables d'environnement.");

  cached = await mongoose.connect(uri);
  return cached;
}
