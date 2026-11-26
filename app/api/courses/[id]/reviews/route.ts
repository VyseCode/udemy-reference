import { getAuthUser } from "@/lib/auth";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { getReviews, isEnrolled } from "@/lib/queries";
import { Course } from "@/models/Course";
import { Review } from "@/models/Review";
import { idParamSchema, reviewSchema } from "@/lib/validation";

type Context = RouteContext<"/api/courses/[id]/reviews">;

export async function GET(_request: Request, context: Context) {
  try {
    const { id } = idParamSchema.parse(await context.params);
    await connectDB();
    const course = await Course.findById(id).select("status").lean();
    if (!course || course.status !== "published") return fail("Course not found", 404);
    return ok(await getReviews(id));
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request, context: Context) {
  try {
    const user = await getAuthUser();
    if (!user) return fail("You must be signed in", 401);
    if (user.role !== "student") return fail("Only students can review courses", 403);

    const { id } = idParamSchema.parse(await context.params);
    const body = reviewSchema.parse(await readJson(request));
    await connectDB();

    const course = await Course.findById(id).select("status").lean();
    if (!course || course.status !== "published") return fail("Course not found", 404);
    if (!(await isEnrolled(id, user.id))) {
      return fail("Enroll in this course before leaving a review", 403);
    }
    if (await Review.exists({ course: id, user: user.id })) {
      return fail("You have already reviewed this course", 409);
    }

    try {
      const review = await Review.create({
        user: user.id,
        course: id,
        rating: body.rating,
        comment: body.comment,
      });
      return ok({ review: { id: review._id.toString(), rating: review.rating } }, 201);
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === 11000
      ) {
        return fail("You have already reviewed this course", 409);
      }
      throw error;
    }
  } catch (error) {
    return handleError(error);
  }
}
