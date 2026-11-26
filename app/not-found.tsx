import Link from "next/link";
import { CompassIcon } from "@/components/Icons";

export default function NotFound() {
  return (
    <main className="flex flex-1 items-center justify-center px-5 py-20">
      <div className="max-w-md text-center">
        <CompassIcon className="mx-auto h-10 w-10 text-accent" />
        <p className="mt-5 font-serif text-6xl">404</p>
        <h1 className="mt-3 font-serif text-2xl">This page went off the map</h1>
        <p className="mt-3 text-sm text-muted">
          The course or page you were looking for may have moved, or you may not have access to it.
        </p>
        <Link
          href="/browse"
          className="mt-6 inline-block rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-deep"
        >
          Back to the catalog
        </Link>
      </div>
    </main>
  );
}
