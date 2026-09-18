import { requireAdminWrite } from "~/server/utils/requireAuth";
import { dbConnect }         from "~/server/lib/mongodb";
import Profile                from "~/server/models/profile";

export default defineEventHandler(async (event) => {
  await requireAdminWrite(event);
  await dbConnect();

  const body = await readBody(event);

  const updated = await Profile.findOneAndUpdate({}, body, {
    upsert: true,
    new: true,
    runValidators: true,
    setDefaultsOnInsert: true,
  }).lean();

  return updated;
});
