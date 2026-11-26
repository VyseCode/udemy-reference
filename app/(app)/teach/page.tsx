import Link from "next/link";
import { CoinsIcon, PlusIcon, StarIcon, UsersIcon } from "@/components/Icons";
import { connectDB } from "@/lib/db";
import { requireInstructor } from "@/lib/auth";
import { getInstructorDashboard } from "@/lib/queries";

export default async function TeachPage() {
  const user = await requireInstructor();
  await connectDB();
  const data = await getInstructorDashboard(user.id);

  const stats = [
    { label: "Courses", value: data.courseCount, Icon: PlusIcon },
    { label: "Students", value: data.studentCount, Icon: UsersIcon },
    { label: "Revenue (simulated)", value: `$${data.revenue.toFixed(2)}`, Icon: CoinsIcon },
    { label: "Average rating", value: data.averageRating ? data.averageRating.toFixed(1) : "—", Icon: StarIcon },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Instructor studio
          </p>
          <h1 className="mt-2 font-serif text-4xl">Your teaching workspace</h1>
          <p className="mt-2 text-muted">Build courses, track learners and refine what you teach.</p>
        </div>
        <Link
          href="/teach/courses/new"
          className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-deep"
        >
          <PlusIcon className="h-4 w-4" /> New course
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, Icon }) => (
          <div key={label} className="rounded-lg border border-line bg-surface p-5">
            <div className="flex items-center justify-between text-muted">
              <span className="text-xs">{label}</span>
              <Icon className="h-5 w-5" />
            </div>
            <p className="mt-3 font-serif text-3xl">{value}</p>
          </div>
        ))}
      </div>

      <section className="mt-10">
        <h2 className="font-serif text-2xl">Your courses</h2>
        {data.courses.length === 0 ? (
          <div className="mt-5 rounded-lg border border-dashed border-line bg-surface px-6 py-14 text-center">
            <p className="font-serif text-xl">Your first course starts here</p>
            <p className="mt-2 text-sm text-muted">
              Create a course, add sections and lectures, then publish when it is ready.
            </p>
            <Link href="/teach/courses/new" className="mt-5 inline-block rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-white">
              Create a course
            </Link>
          </div>
        ) : (
          <div className="mt-5 overflow-hidden rounded-lg border border-line bg-surface">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-paper text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">Course</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Status</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Students</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Revenue</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Rating</th>
                  <th scope="col" className="px-5 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.courses.map((course) => (
                  <tr key={course.id}>
                    <td className="px-5 py-4">
                      <p className="font-medium">{course.title}</p>
                      <p className="text-xs text-muted">{course.category}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        course.status === "published" ? "bg-olive/10 text-olive" : "bg-ink/5 text-muted"
                      }`}>
                        {course.status === "published" ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-5 py-4">{course.students}</td>
                    <td className="px-5 py-4">${course.revenue.toFixed(2)}</td>
                    <td className="px-5 py-4">{course.rating ? `${course.rating.toFixed(1)} ★` : "—"}</td>
                    <td className="px-5 py-4 text-right">
                      <Link href={`/teach/courses/${course.id}`} className="font-semibold text-accent-deep hover:underline">
                        Edit →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <p className="mt-8 text-xs text-muted">
        Revenue and payments are simulated locally — no processor is contacted.
      </p>
    </div>
  );
}
