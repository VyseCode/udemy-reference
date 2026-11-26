import { getSession } from "@/lib/auth";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { isCourseOwner } from "@/lib/queries";
import { Lecture } from "@/models/Lecture";
import { Progress } from "@/models/Progress";
import { media } from "@/lib/media";
import { idParamSchema, lectureUpdateSchema } from "@/lib/validation";

type Context = RouteContext<"/api/lectures/[id]">;

async function ownedLecture(id: string, userId: string) {
  const lecture = await Lecture.findById(id).select("course").lean();
  if (!lecture) return { status: 404 as const };
  if (!(await isCourseOwner(lecture.course.toString(), userId))) {
    return { status: 403 as const };
  }
  return { status: 200 as const };
}

export async function PATCH(request: Request, context: Context) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);
    if (session.role !== "instructor") return fail("Only instructors can edit courses", 403);

    const { id } = idParamSchema.parse(await context.params);
    const body = lectureUpdateSchema.parse(await readJson(request));
    if (Object.keys(body).length === 0) return fail("No changes supplied", 400);

    await connectDB();
    const owned = await ownedLecture(id, session.userId);
    if (owned.status !== 200) {
      return fail(owned.status === 404 ? "Lecture not found" : "You do not own this course", owned.status);
    }

    if (typeof body.videoUrl === "string") {
      body.videoUrl = media.resolveVideoUrl(body.videoUrl);
    }
    await Lecture.updateOne({ _id: id }, { $set: body });
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
    const owned = await ownedLecture(id, session.userId);
    if (owned.status !== 200) {
      return fail(owned.status === 404 ? "Lecture not found" : "You do not own this course", owned.status);
    }

    await Promise.all([
      Progress.deleteMany({ lecture: id }),
      Lecture.deleteOne({ _id: id }),
    ]);
    return ok({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
