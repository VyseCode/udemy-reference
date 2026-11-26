import { getSession } from "@/lib/auth";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { isCourseOwner } from "@/lib/queries";
import { Section } from "@/models/Section";
import { idParamSchema, reorderSchema } from "@/lib/validation";

type Context = RouteContext<"/api/courses/[id]/sections/reorder">;

export async function POST(request: Request, context: Context) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);
    if (session.role !== "instructor") return fail("Only instructors can edit courses", 403);

    const { id } = idParamSchema.parse(await context.params);
    const { ids } = reorderSchema.parse(await readJson(request));
    await connectDB();
    if (!(await isCourseOwner(id, session.userId))) {
      return fail("You do not own this course", 403);
    }

    const existing = await Section.find({ course: id }).select("_id").lean();
    const existingIds = existing.map((section) => section._id.toString());
    if (ids.length !== existingIds.length || !ids.every((value) => existingIds.includes(value))) {
      return fail("Reorder must include exactly this course's sections", 400);
    }
    if (new Set(ids).size !== ids.length) return fail("Duplicate section id in reorder", 400);

    await Section.bulkWrite(
      ids.map((sectionId, index) => ({
        updateOne: { filter: { _id: sectionId }, update: { $set: { order: index } } },
      })),
    );
    return ok({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
