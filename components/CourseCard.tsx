import Link from "next/link";
import type { CourseListItemDTO } from "@/lib/types";
import { ClockIcon, StarIcon, UsersIcon } from "@/components/Icons";

export function CourseCard({ course }: { course: CourseListItemDTO }) {
  return (
    <Link
      href={`/courses/${course.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-lg border border-line bg-surface transition hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-[0_12px_30px_-18px_rgba(28,26,23,0.45)]"
    >
      <div className="relative flex h-36 items-center justify-center overflow-hidden bg-ink">
        <span className="absolute inset-0 opacity-25 [background-image:repeating-linear-gradient(135deg,transparent,transparent_18px,rgba(255,255,255,0.14)_18px,rgba(255,255,255,0.14)_19px)]" />
        <span className="relative font-serif text-2xl tracking-tight text-paper">
          {course.category}
        </span>
        {course.status === "draft" && (
          <span className="absolute right-3 top-3 rounded bg-accent px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
            Draft
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-center gap-2 text-xs text-muted">
          <span>{course.instructor.name}</span>
          <span aria-hidden="true">·</span>
          <span>{course.lectureCount} lessons</span>
        </div>
        <h3 className="font-serif text-xl leading-snug group-hover:text-accent-deep">
          {course.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm text-muted">{course.description}</p>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
          {course.reviewCount > 0 ? (
            <span className="flex items-center gap-1 font-medium text-ink">
              <StarIcon className="h-4 w-4 text-accent" />
              {course.rating.toFixed(1)}
              <span className="font-normal text-muted">({course.reviewCount})</span>
            </span>
          ) : (
            <span>New course</span>
          )}
          <span className="flex items-center gap-1">
            <UsersIcon className="h-4 w-4" />
            {course.studentCount}
          </span>
          <span className="flex items-center gap-1">
            <ClockIcon className="h-4 w-4" />
            {course.totalMinutes}m
          </span>
        </div>
        <div className="mt-auto flex items-center justify-between border-t border-line pt-4">
          <span className="font-serif text-lg">
            {course.price === 0 ? "Free" : `$${course.price.toFixed(2)}`}
          </span>
          {course.enrolled ? (
            <span className="text-xs font-semibold text-olive">Enrolled ✓</span>
          ) : (
            <span className="text-xs font-semibold text-accent-deep group-hover:underline">
              View course →
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
