import Link from "next/link";
import { CourseCard } from "@/components/CourseCard";
import { ArrowRightIcon, LogoMark } from "@/components/Icons";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { listCourses } from "@/lib/queries";

export default async function HomePage() {
  const session = await getSession();
  await connectDB();
  const result = await listCourses({ sort: "rating", limit: 3, viewerId: session?.userId });

  return (
    <main className="flex flex-1 flex-col">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-5">
          <Link href="/" className="flex items-center gap-2.5">
            <LogoMark className="h-8 w-8" />
            <span className="font-serif text-xl tracking-tight">Lumen</span>
          </Link>
          <nav className="ml-auto flex items-center gap-2 sm:gap-5">
            <Link href="/browse" className="text-sm text-muted hover:text-ink">
              Browse courses
            </Link>
            <Link
              href={session ? "/dashboard" : "/login"}
              className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-paper transition hover:bg-accent"
            >
              {session ? "My learning" : "Sign in"}
            </Link>
          </nav>
        </div>
      </header>

      <section className="border-b border-line">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-[1.15fr_0.85fr] md:py-24">
          <div>
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.22em] text-accent">
              Learn with intention
            </p>
            <h1 className="font-serif text-5xl leading-[1.05] sm:text-6xl">
              Go deeper than the next video.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-muted">
              Lumen is a focused place to learn practical skills. Short, deliberate
              lessons. Honest quizzes. A certificate you have to earn.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/browse"
                className="inline-flex items-center gap-2 rounded-md bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-deep"
              >
                Explore courses <ArrowRightIcon className="h-4 w-4" />
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-md border border-line bg-surface px-5 py-3 text-sm font-semibold transition hover:border-ink"
              >
                Create an account
              </Link>
            </div>
          </div>
          <div className="relative hidden md:block">
            <div className="absolute inset-0 translate-x-4 translate-y-4 rounded-lg border border-accent/30" />
            <div className="relative rounded-lg border border-line bg-surface p-8">
              <p className="font-serif text-xl">A different kind of course catalog</p>
              <ul className="mt-6 space-y-4 text-sm text-muted">
                <li className="flex gap-3"><span className="font-serif text-accent">01</span> Curated lessons with real sequencing</li>
                <li className="flex gap-3"><span className="font-serif text-accent">02</span> Progress you can actually measure</li>
                <li className="flex gap-3"><span className="font-serif text-accent">03</span> Quizzes that check understanding</li>
                <li className="flex gap-3"><span className="font-serif text-accent">04</span> Certificates tied to completed work</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl flex-1 px-5 py-14">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              Start here
            </p>
            <h2 className="mt-2 font-serif text-3xl">Highly rated courses</h2>
          </div>
          <Link href="/browse" className="hidden text-sm font-semibold text-accent-deep underline underline-offset-4 sm:inline">
            See all courses
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {result.courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </section>

      <footer className="border-t border-line bg-surface">
        <div className="mx-auto max-w-6xl px-5 py-8 text-xs text-muted">
          Lumen — a reference implementation. Video media and payments are simulated locally.
        </div>
      </footer>
    </main>
  );
}
