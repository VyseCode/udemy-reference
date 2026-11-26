import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { redirect } from "next/navigation";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

export const SESSION_COOKIE = "lumen_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET ||
    "dev-only-secret-change-me-before-deploying-udemy-reference",
);

export type Session = {
  userId: string;
  email: string;
  role: "student" | "instructor";
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "student" | "instructor";
  headline: string;
  avatarUrl: string;
};

export async function signSession(session: Session): Promise<string> {
  return new SignJWT({ email: session.email, role: session.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(session.userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secret);
}

export async function verifySession(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    if (!payload.sub) return null;
    return {
      userId: payload.sub,
      email: typeof payload.email === "string" ? payload.email : "",
      role: payload.role === "instructor" ? "instructor" : "student",
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}

export async function getAuthUser(): Promise<AuthUser | null> {
  const session = await getSession();
  if (!session || !Types.ObjectId.isValid(session.userId)) return null;
  await connectDB();
  const user = await User.findById(session.userId)
    .select("name email role headline avatarUrl")
    .lean();
  if (!user) return null;
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    headline: user.headline ?? "",
    avatarUrl: user.avatarUrl ?? "",
  };
}

export async function requireUser(): Promise<AuthUser> {
  const user = await getAuthUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireInstructor(): Promise<AuthUser> {
  const user = await requireUser();
  if (user.role !== "instructor") redirect("/browse");
  return user;
}
