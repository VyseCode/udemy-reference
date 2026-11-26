import { randomBytes } from "node:crypto";
import { getAuthUser } from "@/lib/auth";
import { fail, handleError, isDuplicateKey, ok } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { getCertificateForCourse, getProgress, getQuiz, isEnrolled } from "@/lib/queries";
import { Certificate } from "@/models/Certificate";
import { idParamSchema } from "@/lib/validation";

type Context = RouteContext<"/api/courses/[id]/certificate">;

export async function GET(_request: Request, context: Context) {
  try {
    const user = await getAuthUser();
    if (!user) return fail("You must be signed in", 401);

    const { id } = idParamSchema.parse(await context.params);
    await connectDB();
    if (!(await isEnrolled(id, user.id))) {
      return fail("Enroll in this course to view its certificate", 403);
    }

    const [progress, quiz, certificate] = await Promise.all([
      getProgress(id, user.id),
      getQuiz(id, user.id),
      getCertificateForCourse(id, user.id),
    ]);
    return ok({
      certificate,
      eligible: progress.percent === 100 && quiz.passed && progress.total > 0,
      requirements: {
        lecturesComplete: progress.percent === 100 && progress.total > 0,
        quizPassed: quiz.passed,
        bestScore: quiz.bestScore,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(_request: Request, context: Context) {
  try {
    const user = await getAuthUser();
    if (!user) return fail("You must be signed in", 401);

    const { id } = idParamSchema.parse(await context.params);
    await connectDB();
    if (!(await isEnrolled(id, user.id))) {
      return fail("Enroll in this course to earn a certificate", 403);
    }

    const existing = await getCertificateForCourse(id, user.id);
    if (existing) return fail("A certificate has already been issued for this course", 409);

    const [progress, quiz] = await Promise.all([
      getProgress(id, user.id),
      getQuiz(id, user.id),
    ]);
    if (progress.total === 0 || progress.percent !== 100) {
      return fail("Complete every lecture before requesting a certificate", 409);
    }
    if (!quiz.passed) {
      return fail("Pass the course quiz with 70% or higher before requesting a certificate", 409);
    }

    const certificateId = `LMN-${id.slice(0, 6).toUpperCase()}-${randomBytes(4).toString("hex").toUpperCase()}`;
    try {
      const certificate = await Certificate.create({
        user: user.id,
        course: id,
        certificateId,
        finalScore: quiz.bestScore,
      });
      return ok(
        {
          certificate: {
            id: certificate._id.toString(),
            certificateId: certificate.certificateId,
            finalScore: certificate.finalScore,
            issuedAt: certificate.issuedAt.toISOString(),
          },
        },
        201,
      );
    } catch (error) {
      if (isDuplicateKey(error)) {
        return fail("A certificate has already been issued for this course", 409);
      }
      throw error;
    }
  } catch (error) {
    return handleError(error);
  }
}
