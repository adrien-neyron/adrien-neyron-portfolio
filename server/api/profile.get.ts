import { dbConnect } from "~/server/lib/mongodb";
import Profile from "~/server/models/profile";

export default defineEventHandler(async () => {
  await dbConnect();
  const profile = await Profile.findOne().lean();
  return profile ?? null;
});
