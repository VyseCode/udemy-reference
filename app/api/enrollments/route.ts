import { getAuthUser } from "@/lib/auth";
import { fail, handleError, ok } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { getStudentDashboard } from "@/lib/queries";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return fail("You must be signed in", 401);
    if (user.role !== "student") return fail("Only students have enrollments", 403);
    await connectDB();
    const dashboard = await getStudentDashboard(user.id);
    return ok({ enrollments: dashboard.courses });
  } catch (error) {
    return handleError(error);
  }
}
