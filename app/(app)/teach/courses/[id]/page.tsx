import Link from "next/link";
import { notFound } from "next/navigation";
import { CourseEditor } from "@/components/CourseEditor";
import { connectDB } from "@/lib/db";
import { requireInstructor } from "@/lib/auth";
import { getCourseCategories, getCourseDetail } from "@/lib/queries";
import { Quiz } from "@/models/Quiz";

type Context = PageProps<"/teach/courses/[id]">;

export default async function EditCoursePage({ params }: Context) {
  const user = await requireInstructor();
  const { id } = await params;
  await connectDB();

  const [course, categories, quiz] = await Promise.all([
    getCourseDetail(id, { id: user.id, role: "instructor" }),
    getCourseCategories(),
    Quiz.findOne({ course: id }).select("questions").lean(),
  ]);
  if (!course || !course.isOwner) notFound();

  const quizQuestions = (quiz?.questions ?? []).map((question) => ({
    id: question._id.toString(),
    prompt: question.prompt,
    options: question.options,
    correctIndex: question.correctIndex,
    explanation: question.explanation ?? "",
  }));

  return (
    <div>
      <Link href="/teach" className="text-sm text-muted hover:text-accent-deep">
        ← Back to studio
      </Link>
      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Editing course</p>
          <h1 className="mt-2 font-serif text-3xl">{course.title}</h1>
        </div>
        <Link href={`/courses/${course.id}`} className="text-sm font-semibold text-accent-deep hover:underline">
          View public page →
        </Link>
      </div>
      <div className="mt-8 rounded-lg border border-line bg-surface p-6 sm:p-8">
        <CourseEditor mode="edit" categories={categories} initial={course} quizQuestions={quizQuestions} />
      </div>
    </div>
  );
}
