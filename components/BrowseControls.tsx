"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SearchIcon } from "@/components/Icons";

type Props = {
  q: string;
  category: string;
  sort: string;
  categories: string[];
};

const sorts = [
  { value: "newest", label: "Newest" },
  { value: "rating", label: "Highest rated" },
  { value: "popular", label: "Most students" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
];

export function BrowseControls({ q, category, sort, categories }: Props) {
  const router = useRouter();
  const [term, setTerm] = useState(q);

  function navigate(next: { q?: string; category?: string; sort?: string }) {
    const params = new URLSearchParams();
    const values = { q, category, sort, ...next };
    if (values.q) params.set("q", values.q);
    if (values.category) params.set("category", values.category);
    if (values.sort && values.sort !== "newest") params.set("sort", values.sort);
    const query = params.toString();
    router.push(query ? `/browse?${query}` : "/browse");
  }

  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          navigate({ q: term.trim() });
        }}
        className="relative"
      >
        <label htmlFor="course-search" className="sr-only">
          Search courses
        </label>
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
          <SearchIcon className="h-4 w-4" />
        </span>
        <input
          id="course-search"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Search by title, topic or category"
          className="w-full rounded-md border border-line bg-paper py-2.5 pl-9 pr-3 text-sm outline-none focus:border-accent"
        />
      </form>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => navigate({ category: "" })}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
            !category ? "border-ink bg-ink text-paper" : "border-line text-muted hover:border-ink"
          }`}
        >
          All topics
        </button>
        {categories.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => navigate({ category: item })}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              category === item
                ? "border-ink bg-ink text-paper"
                : "border-line text-muted hover:border-ink"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-3 border-t border-line pt-4">
        <label htmlFor="course-sort" className="text-xs font-medium text-muted">
          Sort by
        </label>
        <select
          id="course-sort"
          value={sort}
          onChange={(event) => navigate({ sort: event.target.value })}
          className="rounded-md border border-line bg-paper px-3 py-1.5 text-sm outline-none focus:border-accent"
        >
          {sorts.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {(q || category) && (
          <button
            type="button"
            onClick={() => {
              setTerm("");
              router.push("/browse");
            }}
            className="ml-auto text-xs text-accent-deep underline underline-offset-4"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
