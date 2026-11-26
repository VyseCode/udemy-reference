import { z } from "zod";
import { getSession } from "@/lib/auth";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { listCourses, getCourseDetail } from "@/lib/queries";
import { Course } from "@/models/Course";
import { courseCreateSchema } from "@/lib/validation";

const listSchema = z.object({
  q: z.string().default(""),
  category: z.string().default(""),
  sort: z.enum(["newest", "price-asc", "price-desc", "rating", "popular"]).default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(48).default(9),
});

export async function GET(request: Request) {
  try {
    const session = await getSession();
    const params = Object.fromEntries(new URL(request.url).searchParams);
    const query = listSchema.parse(params);
    await connectDB();
    const result = await listCourses({
      q: query.q,
      category: query.category,
      sort: query.sort,
      page: query.page,
      limit: query.limit,
      viewerId: session?.userId,
    });
    return ok(result);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);
    if (session.role !== "instructor") {
      return fail("Only instructors can create courses", 403);
    }
    const body = courseCreateSchema.parse(await readJson(request));
    await connectDB();
    const course = await Course.create({
      instructor: session.userId,
      ...body,
    });
    const detail = await getCourseDetail(course._id.toString(), {
      id: session.userId,
      role: "instructor",
    });
    return ok({ course: detail }, 201);
  } catch (error) {
    return handleError(error);
  }
}
