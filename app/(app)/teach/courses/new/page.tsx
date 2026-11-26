import Link from "next/link";
import { CourseEditor } from "@/components/CourseEditor";
import { connectDB } from "@/lib/db";
import { requireInstructor } from "@/lib/auth";
import { getCourseCategories } from "@/lib/queries";

export default async function NewCoursePage() {
  await requireInstructor();
  await connectDB();
  const categories = await getCourseCategories();

  return (
    <div>
      <Link href="/teach" className="text-sm text-muted hover:text-accent-deep">
        ← Back to studio
      </Link>
      <h1 className="mt-6 font-serif text-4xl">Create a course</h1>
      <p className="mt-2 text-muted">
        Start with the essentials. You can add sections, lectures and a quiz after saving.
      </p>
      <div className="mt-8 rounded-lg border border-line bg-surface p-6 sm:p-8">
        <CourseEditor mode="create" categories={categories} />
      </div>
    </div>
  );
}
