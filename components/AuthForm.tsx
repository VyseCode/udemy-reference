"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogoMark } from "@/components/Icons";

type AuthFormProps = { mode: "login" | "register" };

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<"student" | "instructor">("student");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const payload =
      mode === "register"
        ? {
            name: String(form.get("name") ?? ""),
            email: String(form.get("email") ?? ""),
            password: String(form.get("password") ?? ""),
            role,
          }
        : {
            email: String(form.get("email") ?? ""),
            password: String(form.get("password") ?? ""),
          };

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      router.push(role === "instructor" && mode === "register" ? "/teach" : "/dashboard");
      router.refresh();
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const isRegister = mode === "register";

  return (
    <main className="flex min-h-screen flex-col lg:flex-row">
      <section className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-ink px-12 py-12 text-paper lg:flex">
        <div className="pointer-events-none absolute -right-24 top-24 h-96 w-96 rounded-full border border-accent/40" />
        <div className="pointer-events-none absolute -right-10 top-44 h-72 w-72 rounded-full border border-accent/20" />
        <Link href="/" className="relative flex items-center gap-3">
          <LogoMark />
          <span className="font-serif text-xl tracking-tight">Lumen</span>
        </Link>
        <div className="relative max-w-md">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            Learn with intention
          </p>
          <h2 className="font-serif text-4xl leading-tight">
            Depth over noise. Practice over passive watching.
          </h2>
          <p className="mt-5 text-sm leading-7 text-paper/70">
            Courses built around real work — short lectures, honest quizzes, and a
            certificate you actually have to earn.
          </p>
          <div className="mt-10 flex gap-8 border-t border-paper/15 pt-6 text-sm">
            <div>
              <p className="font-serif text-2xl">16</p>
              <p className="text-paper/60">guided lessons</p>
            </div>
            <div>
              <p className="font-serif text-2xl">5</p>
              <p className="text-paper/60">courses</p>
            </div>
            <div>
              <p className="font-serif text-2xl">2</p>
              <p className="text-paper/60">expert teachers</p>
            </div>
          </div>
        </div>
        <p className="relative text-xs text-paper/40">
          A reference implementation. Media and payments are simulated locally.
        </p>
      </section>

      <section className="flex flex-1 items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-[26rem]">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <LogoMark />
            <span className="font-serif text-xl">Lumen</span>
          </div>

          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            {isRegister ? "Create your account" : "Welcome back"}
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl">
            {isRegister ? "Start learning with purpose" : "Sign in to Lumen"}
          </h1>
          <p className="mt-3 text-sm text-muted">
            {isRegister
              ? "One account for learning and teaching. You can decide what to do next."
              : "Pick up where you left off — your courses are waiting."}
          </p>

          <form onSubmit={submit} className="mt-8 space-y-5">
            {isRegister && (
              <div>
                <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
                  Full name
                </label>
                <input
                  id="name"
                  name="name"
                  required
                  minLength={2}
                  autoComplete="name"
                  placeholder="Ada Lovelace"
                  className="w-full rounded-md border border-line bg-surface px-3.5 py-2.5 text-sm outline-none placeholder:text-muted/60 focus:border-accent focus:ring-2 focus:ring-accent/15"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full rounded-md border border-line bg-surface px-3.5 py-2.5 text-sm outline-none placeholder:text-muted/60 focus:border-accent focus:ring-2 focus:ring-accent/15"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={isRegister ? 8 : 1}
                autoComplete={isRegister ? "new-password" : "current-password"}
                placeholder={isRegister ? "At least 8 characters" : "Your password"}
                className="w-full rounded-md border border-line bg-surface px-3.5 py-2.5 text-sm outline-none placeholder:text-muted/60 focus:border-accent focus:ring-2 focus:ring-accent/15"
              />
            </div>

            {isRegister && (
              <fieldset>
                <legend className="mb-2 text-sm font-medium">I&apos;m here to</legend>
                <div className="grid grid-cols-2 gap-3">
                  {(
                    [
                      { value: "student", label: "Learn", hint: "Take courses" },
                      { value: "instructor", label: "Teach", hint: "Create courses" },
                    ] as const
                  ).map((option) => (
                    <label
                      key={option.value}
                      className={`cursor-pointer rounded-md border px-3 py-2.5 text-sm transition ${
                        role === option.value
                          ? "border-accent bg-accent/5"
                          : "border-line hover:border-muted"
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={option.value}
                        checked={role === option.value}
                        onChange={() => setRole(option.value)}
                        className="sr-only"
                      />
                      <span className="block font-medium">{option.label}</span>
                      <span className="block text-xs text-muted">{option.hint}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            {error && (
              <p
                role="alert"
                className="rounded-md border border-accent/30 bg-accent/5 px-3.5 py-2.5 text-sm text-accent-deep"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-accent-deep disabled:opacity-60"
            >
              {loading
                ? "Please wait..."
                : isRegister
                  ? "Create account"
                  : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            {isRegister ? "Already have an account? " : "New to Lumen? "}
            <Link
              href={isRegister ? "/login" : "/register"}
              className="font-semibold text-accent-deep underline underline-offset-4"
            >
              {isRegister ? "Sign in" : "Create an account"}
            </Link>
          </p>

          {!isRegister && (
            <div className="mt-8 rounded-md border border-line bg-surface p-4 text-xs leading-6 text-muted">
              <p className="mb-1 font-semibold text-ink">Demo accounts</p>
              <p>Instructor — maya.chen@example.com</p>
              <p>Student — priya.nair@example.com</p>
              <p>All demo passwords: <strong className="text-ink">password123</strong></p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
