import { z } from "zod";
import { getAuthUser } from "@/lib/auth";
import { fail, handleError, ok } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { Certificate } from "@/models/Certificate";

const schema = z.object({
  code: z.string().min(6).max(40),
});

export async function GET(
  _request: Request,
  context: RouteContext<"/api/certificates/[code]">,
) {
  try {
    const user = await getAuthUser();
    if (!user) return fail("You must be signed in", 401);
    const { code } = schema.parse(await context.params);
    await connectDB();

    const doc = (await Certificate.findOne({ certificateId: code })
      .populate("course", "title instructor")
      .populate("user", "name")
      .lean()) as unknown as {
      _id: { toString(): string };
      certificateId: string;
      finalScore: number;
      issuedAt: Date;
      user: { _id: { toString(): string }; name: string } | null;
      course: {
        title: string;
        instructor: { toString(): string };
      } | null;
    } | null;

    if (!doc) return fail("Certificate not found", 404);
    const isRecipient = doc.user?._id.toString() === user.id;
    const isInstructor =
      user.role === "instructor" &&
      doc.course?.instructor.toString() === user.id;
    if (!isRecipient && !isInstructor) {
      return fail("You are not authorized to view this certificate", 403);
    }

    return ok({
      certificate: {
        id: doc._id.toString(),
        certificateId: doc.certificateId,
        finalScore: doc.finalScore,
        issuedAt: doc.issuedAt.toISOString(),
        courseTitle: doc.course?.title ?? "",
        studentName: doc.user?.name ?? "",
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
