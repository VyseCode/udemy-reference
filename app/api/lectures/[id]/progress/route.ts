import { z } from "zod";
import { getAuthUser } from "@/lib/auth";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { getProgress, isEnrolled } from "@/lib/queries";
import { Lecture } from "@/models/Lecture";
import { Progress } from "@/models/Progress";
import { idParamSchema } from "@/lib/validation";

const schema = z.object({
  completed: z.boolean(),
});

type Context = RouteContext<"/api/lectures/[id]/progress">;

export async function PUT(request: Request, context: Context) {
  try {
    const user = await getAuthUser();
    if (!user) return fail("You must be signed in", 401);

    const { id } = idParamSchema.parse(await context.params);
    const { completed } = schema.parse(await readJson(request));
    await connectDB();

    const lecture = await Lecture.findById(id).select("course").lean();
    if (!lecture) return fail("Lecture not found", 404);
    const courseId = lecture.course.toString();
    if (!(await isEnrolled(courseId, user.id))) {
      return fail("Enroll in this course to track progress", 403);
    }

    await Progress.updateOne(
      { user: user.id, lecture: id },
      {
        $set: { completed, completedAt: completed ? new Date() : null },
        $setOnInsert: { course: courseId },
      },
      { upsert: true },
    );

    return ok({ progress: await getProgress(courseId, user.id) });
  } catch (error) {
    return handleError(error);
  }
}
