import { getAuthUser } from "@/lib/auth";
import { fail, handleError, isDuplicateKey, ok } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { isEnrolled } from "@/lib/queries";
import { Course } from "@/models/Course";
import { Enrollment } from "@/models/Enrollment";
import { payments } from "@/lib/payments";
import { idParamSchema } from "@/lib/validation";

type Context = RouteContext<"/api/courses/[id]/enroll">;

export async function POST(_request: Request, context: Context) {
  try {
    const user = await getAuthUser();
    if (!user) return fail("You must be signed in", 401);
    if (user.role !== "student") return fail("Only students can enroll in courses", 403);

    const { id } = idParamSchema.parse(await context.params);
    await connectDB();

    const course = await Course.findById(id).select("title price status").lean();
    if (!course || course.status !== "published") return fail("Course not found", 404);
    if (await isEnrolled(id, user.id)) {
      return fail("You are already enrolled in this course", 409);
    }

    const receipt = await payments.charge(course.price, course.title);
    try {
      const enrollment = await Enrollment.create({
        user: user.id,
        course: id,
        pricePaid: receipt.amount,
        status: "active",
      });
      return ok(
        {
          enrollment: {
            id: enrollment._id.toString(),
            courseId: id,
            pricePaid: enrollment.pricePaid,
            simulatedReceipt: receipt.reference,
          },
        },
        201,
      );
    } catch (error) {
      if (isDuplicateKey(error)) {
        return fail("You are already enrolled in this course", 409);
      }
      throw error;
    }
  } catch (error) {
    return handleError(error);
  }
}
