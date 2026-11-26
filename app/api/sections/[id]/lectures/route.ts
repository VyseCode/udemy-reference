import { getSession } from "@/lib/auth";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { isCourseOwner } from "@/lib/queries";
import { Section } from "@/models/Section";
import { Lecture } from "@/models/Lecture";
import { media } from "@/lib/media";
import { idParamSchema, lectureCreateSchema } from "@/lib/validation";

type Context = RouteContext<"/api/sections/[id]/lectures">;

export async function POST(request: Request, context: Context) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);
    if (session.role !== "instructor") return fail("Only instructors can edit courses", 403);

    const { id } = idParamSchema.parse(await context.params);
    const body = lectureCreateSchema.parse(await readJson(request));
    await connectDB();

    const section = await Section.findById(id).select("course").lean();
    if (!section) return fail("Section not found", 404);
    if (!(await isCourseOwner(section.course.toString(), session.userId))) {
      return fail("You do not own this course", 403);
    }

    const count = await Lecture.countDocuments({ section: id });
    const lecture = await Lecture.create({
      course: section.course,
      section: id,
      title: body.title,
      description: body.description,
      order: body.order ?? count,
      duration: body.duration,
      videoUrl: media.resolveVideoUrl(body.videoUrl),
      isPreview: body.isPreview,
    });
    return ok({ lecture: { id: lecture._id.toString() } }, 201);
  } catch (error) {
    return handleError(error);
  }
}
