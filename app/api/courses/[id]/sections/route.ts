import { getSession } from "@/lib/auth";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { isCourseOwner } from "@/lib/queries";
import { Course } from "@/models/Course";
import { Section } from "@/models/Section";
import { idParamSchema, sectionCreateSchema } from "@/lib/validation";

type Context = RouteContext<"/api/courses/[id]/sections">;

export async function POST(request: Request, context: Context) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);
    if (session.role !== "instructor") return fail("Only instructors can edit courses", 403);

    const { id } = idParamSchema.parse(await context.params);
    const body = sectionCreateSchema.parse(await readJson(request));
    await connectDB();
    if (!(await isCourseOwner(id, session.userId))) {
      return fail("You do not own this course", 403);
    }
    if (!(await Course.exists({ _id: id }))) return fail("Course not found", 404);

    const count = await Section.countDocuments({ course: id });
    const section = await Section.create({
      course: id,
      title: body.title,
      order: body.order ?? count,
    });
    return ok(
      { section: { id: section._id.toString(), title: section.title, order: section.order } },
      201,
    );
  } catch (error) {
    return handleError(error);
  }
}
