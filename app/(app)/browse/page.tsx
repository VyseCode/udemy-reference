import Link from "next/link";
import { CourseCard } from "@/components/CourseCard";
import { BrowseControls } from "@/components/BrowseControls";
import { ChevronIcon } from "@/components/Icons";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getCourseCategories, listCourses } from "@/lib/queries";

type SearchParams = Promise<{
  q?: string;
  category?: string;
  sort?: string;
  page?: string;
}>;

export default async function BrowsePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const session = await getSession();
  await connectDB();

  const q = params.q ?? "";
  const category = params.category ?? "";
  const sort = params.sort ?? "newest";
  const page = Number(params.page ?? 1) || 1;

  const [result, categories] = await Promise.all([
    listCourses({ q, category, sort, page, limit: 6, viewerId: session?.userId }),
    getCourseCategories(),
  ]);

  function pageHref(target: number) {
    const query = new URLSearchParams();
    if (q) query.set("q", q);
    if (category) query.set("category", category);
    if (sort !== "newest") query.set("sort", sort);
    query.set("page", String(target));
    return `/browse?${query.toString()}`;
  }

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
        Course catalog
      </p>
      <h1 className="mt-2 font-serif text-4xl">Find your next course</h1>
      <p className="mt-2 text-muted">
        Browse {result.total} published {result.total === 1 ? "course" : "courses"} from working instructors.
      </p>

      <div className="mt-8">
        <BrowseControls q={q} category={category} sort={sort} categories={categories} />
      </div>

      {result.courses.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-line bg-surface px-6 py-16 text-center">
          <p className="font-serif text-2xl">No courses matched that search</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Try a different topic, or clear the filters to see the full catalog.
          </p>
          <Link
            href="/browse"
            className="mt-5 inline-block rounded-md border border-line px-4 py-2 text-sm font-semibold hover:border-ink"
          >
            Clear filters
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {result.courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>

          {result.pages > 1 && (
            <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Pagination">
              {Array.from({ length: result.pages }, (_, index) => index + 1).map((target) => (
                <Link
                  key={target}
                  href={pageHref(target)}
                  aria-current={target === result.page ? "page" : undefined}
                  className={`flex h-9 w-9 items-center justify-center rounded-md border text-sm ${
                    target === result.page
                      ? "border-accent bg-accent text-white"
                      : "border-line bg-surface text-muted hover:border-ink"
                  }`}
                >
                  {target}
                </Link>
              ))}
              {result.page < result.pages && (
                <Link
                  href={pageHref(result.page + 1)}
                  className="ml-2 flex items-center gap-1 text-sm font-semibold text-accent-deep"
                >
                  Next <ChevronIcon className="h-4 w-4" />
                </Link>
              )}
            </nav>
          )}
        </>
      )}
    </div>
  );
}
