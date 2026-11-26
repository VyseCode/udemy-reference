import Link from "next/link";
import { notFound } from "next/navigation";
import { EnrollButton } from "@/components/EnrollButton";
import { ClockIcon, PlayIcon, StarIcon, UsersIcon } from "@/components/Icons";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getCourseDetail, getReviews } from "@/lib/queries";

type Context = PageProps<"/courses/[id]">;

export default async function CoursePage({ params }: Context) {
  const { id } = await params;
  const session = await getSession();
  await connectDB();

  const course = await getCourseDetail(
    id,
    session ? { id: session.userId, role: session.role } : null,
  );
  if (!course) notFound();

  const reviews = await getReviews(course.id);
  const lessonCount = course.sections.reduce((sum, section) => sum + section.lectures.length, 0);

  return (
    <div>
      <Link href="/browse" className="text-sm text-muted hover:text-accent-deep">
        ← Back to catalog
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-3 text-xs">
            <span className="rounded-full bg-accent/10 px-3 py-1 font-semibold text-accent-deep">
              {course.category}
            </span>
            {course.status === "draft" && (
              <span className="rounded-full bg-ink px-3 py-1 font-semibold text-paper">Draft — only you can see this</span>
            )}
          </div>
          <h1 className="font-serif text-4xl leading-tight sm:text-5xl">{course.title}</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-muted">{course.description}</p>
          <p className="mt-4 text-sm">
            Taught by <strong>{course.instructor.name}</strong>
          </p>

          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
            {reviews.count > 0 && (
              <span className="flex items-center gap-1.5 font-medium text-ink">
                <StarIcon className="h-4 w-4 text-accent" /> {reviews.average.toFixed(1)} ({reviews.count} reviews)
              </span>
            )}
            <span className="flex items-center gap-1.5"><UsersIcon className="h-4 w-4" /> {course.studentCount} students</span>
            <span className="flex items-center gap-1.5"><ClockIcon className="h-4 w-4" /> {course.totalMinutes} minutes</span>
            <span>{lessonCount} lessons</span>
          </div>

          <section className="mt-10">
            <div className="flex items-end justify-between">
              <h2 className="font-serif text-2xl">Curriculum</h2>
              <p className="text-xs text-muted">{course.sections.length} sections · {lessonCount} lessons</p>
            </div>
            <div className="mt-4 divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
              {course.sections.length === 0 ? (
                <p className="px-5 py-10 text-center text-sm text-muted">
                  The instructor is still putting this curriculum together.
                </p>
              ) : (
                course.sections.map((section) => (
                  <div key={section.id}>
                    <div className="flex items-center justify-between bg-paper px-5 py-3">
                      <h3 className="font-semibold">{section.title}</h3>
                      <span className="text-xs text-muted">{section.lectures.length} lessons</span>
                    </div>
                    <ul>
                      {section.lectures.map((lecture) => (
                        <li
                          key={lecture.id}
                          className="flex items-center gap-3 border-t border-line px-5 py-3 text-sm"
                        >
                          <PlayIcon className="h-4 w-4 shrink-0 text-muted" />
                          <span className="flex-1">{lecture.title}</span>
                          {lecture.isPreview && (
                            <span className="rounded bg-olive/10 px-2 py-0.5 text-[10px] font-semibold text-olive">Preview</span>
                          )}
                          <span className="text-xs text-muted">{lecture.duration}m</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="mt-10">
            <h2 className="font-serif text-2xl">Learner reviews</h2>
            {reviews.count === 0 ? (
              <p className="mt-4 rounded-lg border border-dashed border-line bg-surface px-5 py-10 text-center text-sm text-muted">
                No reviews yet. Enrolled learners can leave the first one.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {reviews.reviews.map((review) => (
                  <article key={review.id} className="rounded-lg border border-line bg-surface p-5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-olive text-xs font-semibold text-white">
                        {review.author.name.slice(0, 1)}
                      </span>
                      <span className="text-sm font-medium">{review.author.name}</span>
                      <span className="ml-auto flex items-center gap-1 text-sm font-semibold text-accent-deep">
                        <StarIcon className="h-4 w-4 text-accent" /> {review.rating}/5
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-muted">{review.comment}</p>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="overflow-hidden rounded-lg border border-line bg-surface">
            <div className="flex h-40 items-center justify-center bg-ink">
              <span className="font-serif text-xl text-paper/80">{course.category}</span>
            </div>
            <div className="p-5">
              <p className="font-serif text-3xl">
                {course.price === 0 ? "Free" : `$${course.price.toFixed(2)}`}
              </p>
              <div className="mt-4">
                <EnrollButton
                  courseId={course.id}
                  price={course.price}
                  enrolled={course.enrolled}
                  isOwner={course.isOwner}
                  published={course.status === "published"}
                />
              </div>
              <ul className="mt-5 space-y-2 border-t border-line pt-4 text-xs text-muted">
                <li>{course.sections.length} sections, {lessonCount} lessons</li>
                <li>{course.totalMinutes} minutes of instruction</li>
                <li>Quizzes and a verifiable certificate</li>
                <li>Access on any device</li>
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
