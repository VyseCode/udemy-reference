import { getSession } from "@/lib/auth";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { getQuiz, isCourseOwner, isEnrolled } from "@/lib/queries";
import { Quiz } from "@/models/Quiz";
import { Course } from "@/models/Course";
import { idParamSchema, quizCreateSchema } from "@/lib/validation";

type Context = RouteContext<"/api/courses/[id]/quiz">;

export async function GET(_request: Request, context: Context) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);
    const { id } = idParamSchema.parse(await context.params);
    await connectDB();

    const owner = await isCourseOwner(id, session.userId);
    if (owner && session.role === "instructor") {
      const quiz = await Quiz.findOne({ course: id }).select("questions").lean();
      return ok({
        courseId: id,
        questions: (quiz?.questions ?? []).map((question) => ({
          id: question._id.toString(),
          prompt: question.prompt,
          options: question.options,
          correctIndex: question.correctIndex,
          explanation: question.explanation ?? "",
        })),
        manage: true,
      });
    }

    if (!(await Course.exists({ _id: id, status: "published" }))) {
      return fail("Course not found", 404);
    }
    if (!(await isEnrolled(id, session.userId))) {
      return fail("Enroll in this course before taking its quiz", 403);
    }
    return ok(await getQuiz(id, session.userId));
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(request: Request, context: Context) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);
    if (session.role !== "instructor") return fail("Only instructors can edit quizzes", 403);

    const { id } = idParamSchema.parse(await context.params);
    const body = quizCreateSchema.parse(await readJson(request));
    await connectDB();
    if (!(await isCourseOwner(id, session.userId))) {
      return fail("You do not own this course", 403);
    }
    for (const question of body.questions) {
      if (question.correctIndex >= question.options.length) {
        return fail("Correct answer index is out of range", 400);
      }
    }

    await Quiz.findOneAndUpdate(
      { course: id },
      { $set: { questions: body.questions } },
      { upsert: true, new: true },
    );
    return ok({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
