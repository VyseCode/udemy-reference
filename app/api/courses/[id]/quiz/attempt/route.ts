import { Types } from "mongoose";
import { getAuthUser } from "@/lib/auth";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { isEnrolled } from "@/lib/queries";
import { Quiz } from "@/models/Quiz";
import { QuizAttempt } from "@/models/QuizAttempt";
import { Course } from "@/models/Course";
import { idParamSchema, quizAttemptSchema } from "@/lib/validation";

type Context = RouteContext<"/api/courses/[id]/quiz/attempt">;

export async function POST(request: Request, context: Context) {
  try {
    const user = await getAuthUser();
    if (!user) return fail("You must be signed in", 401);

    const { id } = idParamSchema.parse(await context.params);
    const body = quizAttemptSchema.parse(await readJson(request));
    await connectDB();

    const course = await Course.findById(id).select("status").lean();
    if (!course || course.status !== "published") return fail("Course not found", 404);
    if (!(await isEnrolled(id, user.id))) {
      return fail("Enroll in this course before taking its quiz", 403);
    }

    const quiz = await Quiz.findOne({ course: id }).select("questions").lean();
    if (!quiz || quiz.questions.length === 0) {
      return fail("This course does not have a quiz yet", 404);
    }

    const answersById = new Map<string, number>();
    for (const answer of body.answers) {
      if (!Types.ObjectId.isValid(answer.questionId)) {
        return fail("Invalid answer: unknown question", 400);
      }
      if (answersById.has(answer.questionId)) {
        return fail("Invalid answer: duplicate question", 400);
      }
      answersById.set(answer.questionId, answer.selectedIndex);
    }
    if (answersById.size !== quiz.questions.length) {
      return fail("Answer every question before submitting", 400);
    }

    let correctCount = 0;
    for (const question of quiz.questions) {
      const selected = answersById.get(question._id.toString());
      if (selected === undefined) {
        return fail("Answer every question before submitting", 400);
      }
      if (selected >= question.options.length) {
        return fail("Invalid answer: choice is out of range", 400);
      }
      if (selected === question.correctIndex) correctCount += 1;
    }

    const total = quiz.questions.length;
    const score = Math.round((correctCount / total) * 100);
    const attempt = await QuizAttempt.create({
      user: user.id,
      course: id,
      answers: body.answers.map((answer) => ({
        questionId: new Types.ObjectId(answer.questionId),
        selectedIndex: answer.selectedIndex,
      })),
      correctCount,
      total,
      score,
      passed: score >= 70,
    });

    return ok(
      {
        attempt: {
          id: attempt._id.toString(),
          score: attempt.score,
          correctCount: attempt.correctCount,
          total: attempt.total,
          passed: attempt.passed,
          attemptedAt: attempt.createdAt.toISOString(),
        },
      },
      201,
    );
  } catch (error) {
    return handleError(error);
  }
}
