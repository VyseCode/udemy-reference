import { getSession } from "@/lib/auth";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { getCourseDetail, isCourseOwner } from "@/lib/queries";
import { Course } from "@/models/Course";
import { Enrollment } from "@/models/Enrollment";
import { Progress } from "@/models/Progress";
import { Section } from "@/models/Section";
import { Lecture } from "@/models/Lecture";
import { Quiz } from "@/models/Quiz";
import { QuizAttempt } from "@/models/QuizAttempt";
import { Review } from "@/models/Review";
import { Certificate } from "@/models/Certificate";
import { courseUpdateSchema, idParamSchema } from "@/lib/validation";

type Context = RouteContext<"/api/courses/[id]">;

export async function GET(_request: Request, context: Context) {
  try {
    const session = await getSession();
    const { id } = idParamSchema.parse(await context.params);
    await connectDB();
    const detail = await getCourseDetail(
      id,
      session ? { id: session.userId, role: session.role } : null,
    );
    if (!detail) return fail("Course not found", 404);
    return ok({ course: detail });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);
    if (session.role !== "instructor") return fail("Only instructors can edit courses", 403);

    const { id } = idParamSchema.parse(await context.params);
    const body = courseUpdateSchema.parse(await readJson(request));
    if (Object.keys(body).length === 0) return fail("No changes supplied", 400);

    await connectDB();
    if (!(await isCourseOwner(id, session.userId))) {
      return fail("You do not own this course", 403);
    }

    await Course.updateOne({ _id: id }, { $set: body });
    const detail = await getCourseDetail(id, {
      id: session.userId,
      role: "instructor",
    });
    return ok({ course: detail });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);
    if (session.role !== "instructor") return fail("Only instructors can delete courses", 403);

    const { id } = idParamSchema.parse(await context.params);
    await connectDB();
    if (!(await isCourseOwner(id, session.userId))) {
      return fail("You do not own this course", 403);
    }

    await Promise.all([
      Section.deleteMany({ course: id }),
      Lecture.deleteMany({ course: id }),
      Enrollment.deleteMany({ course: id }),
      Progress.deleteMany({ course: id }),
      Quiz.deleteMany({ course: id }),
      QuizAttempt.deleteMany({ course: id }),
      Review.deleteMany({ course: id }),
      Certificate.deleteMany({ course: id }),
      Course.deleteOne({ _id: id }),
    ]);
    return ok({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
