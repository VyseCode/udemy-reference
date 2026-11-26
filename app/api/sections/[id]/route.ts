import { getSession } from "@/lib/auth";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { isCourseOwner } from "@/lib/queries";
import { Section } from "@/models/Section";
import { Lecture } from "@/models/Lecture";
import { Progress } from "@/models/Progress";
import { idParamSchema, sectionUpdateSchema } from "@/lib/validation";

type Context = RouteContext<"/api/sections/[id]">;

async function ownedSection(id: string, userId: string) {
  const section = await Section.findById(id).select("course").lean();
  if (!section) return { status: 404 as const };
  if (!(await isCourseOwner(section.course.toString(), userId))) {
    return { status: 403 as const };
  }
  return { status: 200 as const, section };
}

export async function PATCH(request: Request, context: Context) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);
    if (session.role !== "instructor") return fail("Only instructors can edit courses", 403);

    const { id } = idParamSchema.parse(await context.params);
    const body = sectionUpdateSchema.parse(await readJson(request));
    if (Object.keys(body).length === 0) return fail("No changes supplied", 400);

    await connectDB();
    const owned = await ownedSection(id, session.userId);
    if (owned.status !== 200) {
      return fail(owned.status === 404 ? "Section not found" : "You do not own this course", owned.status);
    }

    await Section.updateOne({ _id: id }, { $set: body });
    return ok({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);
    if (session.role !== "instructor") return fail("Only instructors can edit courses", 403);

    const { id } = idParamSchema.parse(await context.params);
    await connectDB();
    const owned = await ownedSection(id, session.userId);
    if (owned.status !== 200) {
      return fail(owned.status === 404 ? "Section not found" : "You do not own this course", owned.status);
    }

    const lectures = await Lecture.find({ section: id }).select("_id").lean();
    const lectureIds = lectures.map((lecture) => lecture._id);
    await Promise.all([
      Progress.deleteMany({ lecture: { $in: lectureIds } }),
      Lecture.deleteMany({ section: id }),
      Section.deleteOne({ _id: id }),
    ]);
    return ok({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
