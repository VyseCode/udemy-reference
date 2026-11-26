"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LockIcon } from "@/components/Icons";

type Props = {
  courseId: string;
  price: number;
  enrolled: boolean;
  isOwner: boolean;
  published: boolean;
};

export function EnrollButton({ courseId, price, enrolled, isOwner, published }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function enroll() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(`/api/courses/${courseId}/enroll`, {
        method: "POST",
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setMessage(data.error ?? "Enrollment failed");
        return;
      }
      router.push(`/courses/${courseId}/learn`);
      router.refresh();
    } catch {
      setMessage("Unable to reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (isOwner) {
    return (
      <div className="rounded-md border border-line bg-surface p-4 text-sm text-muted">
        This is your course. Open the{" "}
        <button
          type="button"
          onClick={() => router.push(`/teach/courses/${courseId}`)}
          className="font-semibold text-accent-deep underline underline-offset-4"
        >
          instructor studio
        </button>{" "}
        to edit it.
      </div>
    );
  }

  if (enrolled) {
    return (
      <button
        type="button"
        onClick={() => router.push(`/courses/${courseId}/learn`)}
        className="w-full rounded-md bg-olive px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
      >
        Go to course
      </button>
    );
  }

  return (
    <div>
      <button
        type="button"
        disabled={!published || loading}
        onClick={enroll}
        className="w-full rounded-md bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-deep disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Enrolling..." : published ? (price === 0 ? "Enroll for free" : `Enroll for $${price.toFixed(2)}`) : "Unavailable"}
      </button>
      {published && price > 0 && (
        <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-muted">
          <LockIcon className="h-3.5 w-3.5" />
          Simulated checkout — no card required
        </p>
      )}
      {message && (
        <p role="alert" className="mt-3 rounded-md bg-accent/5 px-3 py-2 text-sm text-accent-deep">
          {message}
        </p>
      )}
    </div>
  );
}
