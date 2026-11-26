import { getSession } from "@/lib/auth";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { isCourseOwner } from "@/lib/queries";
import { Section } from "@/models/Section";
import { Lecture } from "@/models/Lecture";
import { idParamSchema, reorderSchema } from "@/lib/validation";

type Context = RouteContext<"/api/sections/[id]/lectures/reorder">;

export async function POST(request: Request, context: Context) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);
    if (session.role !== "instructor") return fail("Only instructors can edit courses", 403);

    const { id } = idParamSchema.parse(await context.params);
    const { ids } = reorderSchema.parse(await readJson(request));
    await connectDB();

    const section = await Section.findById(id).select("course").lean();
    if (!section) return fail("Section not found", 404);
    if (!(await isCourseOwner(section.course.toString(), session.userId))) {
      return fail("You do not own this course", 403);
    }

    const existing = await Lecture.find({ section: id }).select("_id").lean();
    const existingIds = existing.map((lecture) => lecture._id.toString());
    if (ids.length !== existingIds.length || !ids.every((value) => existingIds.includes(value))) {
      return fail("Reorder must include exactly this section's lectures", 400);
    }
    if (new Set(ids).size !== ids.length) return fail("Duplicate lecture id in reorder", 400);

    await Lecture.bulkWrite(
      ids.map((lectureId, index) => ({
        updateOne: { filter: { _id: lectureId }, update: { $set: { order: index } } },
      })),
    );
    return ok({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
