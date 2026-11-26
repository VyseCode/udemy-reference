import { getAuthUser } from "@/lib/auth";
import { fail, handleError, ok } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { isCourseOwner } from "@/lib/queries";
import { Enrollment } from "@/models/Enrollment";
import { idParamSchema } from "@/lib/validation";

type Context = RouteContext<"/api/courses/[id]/enrollments">;

export async function GET(_request: Request, context: Context) {
  try {
    const user = await getAuthUser();
    if (!user) return fail("You must be signed in", 401);
    if (user.role !== "instructor") return fail("Only instructors can view course students", 403);

    const { id } = idParamSchema.parse(await context.params);
    await connectDB();
    if (!(await isCourseOwner(id, user.id))) {
      return fail("You do not own this course", 403);
    }

    const docs = await Enrollment.find({ course: id })
      .populate("user", "name email headline")
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();
    return ok({
      enrollments: docs.map((doc) => {
        const student = doc.user as unknown as {
          _id: { toString(): string };
          name: string;
          email: string;
          headline: string;
        } | null;
        return {
          id: doc._id.toString(),
          enrolledAt: doc.createdAt.toISOString(),
          pricePaid: doc.pricePaid,
          student: student
            ? {
                id: student._id.toString(),
                name: student.name,
                email: student.email,
                headline: student.headline ?? "",
              }
            : null,
        };
      }),
    });
  } catch (error) {
    return handleError(error);
  }
}
