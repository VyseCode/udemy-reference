import { getAuthUser } from "@/lib/auth";
import { fail, handleError, ok } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { getProgress, isEnrolled } from "@/lib/queries";
import { idParamSchema } from "@/lib/validation";

type Context = RouteContext<"/api/courses/[id]/progress">;

export async function GET(_request: Request, context: Context) {
  try {
    const user = await getAuthUser();
    if (!user) return fail("You must be signed in", 401);

    const { id } = idParamSchema.parse(await context.params);
    await connectDB();
    if (!(await isEnrolled(id, user.id))) {
      return fail("Enroll in this course to track progress", 403);
    }
    return ok({ progress: await getProgress(id, user.id) });
  } catch (error) {
    return handleError(error);
  }
}
