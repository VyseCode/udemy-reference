import Link from "next/link";
import { BookIcon, CertificateIcon, ClockIcon } from "@/components/Icons";
import { ProgressBar } from "@/components/ProgressBar";
import { connectDB } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getStudentDashboard } from "@/lib/queries";

export default async function DashboardPage() {
  const user = await requireUser();
  await connectDB();
  const data = await getStudentDashboard(user.id);

  const stats = [
    { label: "Courses enrolled", value: data.enrolledCount, Icon: BookIcon },
    { label: "In progress", value: data.inProgressCount, Icon: ClockIcon },
    { label: "Completed", value: data.completedCount, Icon: BookIcon },
    { label: "Certificates", value: data.certificateCount, Icon: CertificateIcon },
  ];

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
        Your workspace
      </p>
      <h1 className="mt-2 font-serif text-4xl">My learning</h1>
      <p className="mt-2 text-muted">Welcome back, {user.name.split(" ")[0]}. Keep the momentum going.</p>

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
        <h2 className="font-serif text-2xl">Continue learning</h2>
        {data.courses.length === 0 ? (
          <div className="mt-5 rounded-lg border border-dashed border-line bg-surface px-6 py-14 text-center">
            <p className="font-serif text-xl">Your shelf is empty</p>
            <p className="mt-2 text-sm text-muted">
              Browse the catalog and enroll in a course to start building your progress.
            </p>
            <Link
              href="/browse"
              className="mt-5 inline-block rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-deep"
            >
              Browse courses
            </Link>
          </div>
        ) : (
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {data.courses.map((item) => (
              <Link
                key={item.id}
                href={`/courses/${item.course.id}/learn`}
                className="group rounded-lg border border-line bg-surface p-5 transition hover:border-accent/50"
              >
                <p className="text-xs text-muted">{item.course.category}</p>
                <h3 className="mt-1 font-serif text-xl group-hover:text-accent-deep">
                  {item.course.title}
                </h3>
                <p className="mt-1 text-xs text-muted">with {item.course.instructor.name}</p>
                <div className="mt-5">
                  <ProgressBar percent={item.percent} label="Course progress" />
                </div>
                <p className="mt-4 text-xs font-semibold text-accent-deep">
                  {item.percent === 100 ? "Review course →" : "Continue course →"}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
