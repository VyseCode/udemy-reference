import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { fail, handleError, isDuplicateKey, ok, readJson } from "@/lib/api";
import { SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/auth";

const schema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
  role: z.enum(["student", "instructor"]).optional().default("student"),
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await readJson(request));
    await connectDB();

    if (await User.exists({ email: body.email })) {
      return fail("An account with that email already exists", 409);
    }

    const passwordHash = await bcrypt.hash(body.password, 12);
    const user = await User.create({
      name: body.name,
      email: body.email,
      password: passwordHash,
      role: body.role,
    });

    const token = await signSession({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, token, sessionCookieOptions());

    return ok(
      {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          headline: user.headline,
          avatarUrl: user.avatarUrl,
        },
      },
      201,
    );
  } catch (error) {
    if (isDuplicateKey(error)) {
      return fail("An account with that email already exists", 409);
    }
    return handleError(error);
  }
}
