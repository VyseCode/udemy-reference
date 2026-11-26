"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  CertificateIcon,
  CheckIcon,
  ClockIcon,
  PlayIcon,
  QuizIcon,
  StarIcon,
} from "@/components/Icons";
import { ProgressBar } from "@/components/ProgressBar";
import type {
  CertificateDTO,
  CourseDetailDTO,
  ProgressDTO,
  QuizDTO,
  ReviewSummaryDTO,
} from "@/lib/types";

type Props = {
  course: CourseDetailDTO;
  progress: ProgressDTO;
  quiz: QuizDTO;
  reviews: ReviewSummaryDTO;
  certificate: CertificateDTO | null;
  myReview: { rating: number; comment: string } | null;
  studentName: string;
};

type Tab = "lesson" | "quiz" | "review" | "certificate";

export function LearnView({
  course,
  progress: initialProgress,
  quiz: initialQuiz,
  reviews: initialReviews,
  certificate: initialCertificate,
  myReview: initialReview,
  studentName,
}: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("lesson");
  const [progress, setProgress] = useState(initialProgress);
  const [quiz, setQuiz] = useState(initialQuiz);
  const [reviews, setReviews] = useState(initialReviews);
  const [certificate, setCertificate] = useState(initialCertificate);
  const [myReview, setMyReview] = useState(initialReview);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [quizResult, setQuizResult] = useState<{ score: number; passed: boolean } | null>(null);
  const [rating, setRating] = useState(myReview?.rating ?? 5);
  const [comment, setComment] = useState(myReview?.comment ?? "");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const lectures = course.sections.flatMap((section) => section.lectures);
  const [selectedId, setSelectedId] = useState(lectures[0]?.id ?? "");
  const selected = lectures.find((lecture) => lecture.id === selectedId) ?? lectures[0];
  const completed = new Set(progress.completedLectureIds);

  async function call(path: string, options: RequestInit): Promise<Record<string, unknown>> {
    const response = await fetch(path, {
      ...options,
      headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
    });
    const data = (await response.json()) as Record<string, unknown> & { error?: string };
    if (!response.ok) throw new Error(data.error ?? "Request failed");
    return data;
  }

  function reportError(err: unknown) {
    setError(err instanceof Error ? err.message : "Something went wrong");
    setNotice("");
  }

  async function toggleComplete() {
    if (!selected) return;
    setBusy(true);
    try {
      const data = await call(`/api/lectures/${selected.id}/progress`, {
        method: "PUT",
        body: JSON.stringify({ completed: !completed.has(selected.id) }),
      });
      setProgress(data.progress as ProgressDTO);
      setError("");
      router.refresh();
    } catch (err) {
      reportError(err);
    } finally {
      setBusy(false);
    }
  }

  async function submitQuiz() {
    setBusy(true);
    setError("");
    try {
      const data = await call(`/api/courses/${course.id}/quiz/attempt`, {
        method: "POST",
        body: JSON.stringify({
          answers: Object.entries(answers).map(([questionId, selectedIndex]) => ({
            questionId,
            selectedIndex,
          })),
        }),
      });
      const attempt = data.attempt as QuizDTO["attempts"][number];
      setQuiz((current) => ({
        ...current,
        attempts: [attempt, ...current.attempts],
        passed: current.passed || attempt.passed,
        bestScore: Math.max(current.bestScore, attempt.score),
      }));
      setQuizResult({ score: attempt.score, passed: attempt.passed });
      setNotice(
        attempt.passed
          ? `Passed with ${attempt.score}%.`
          : `Score ${attempt.score}% — you need 70% to pass. Try again.`,
      );
    } catch (err) {
      reportError(err);
    } finally {
      setBusy(false);
    }
  }

  async function submitReview() {
    setBusy(true);
    setError("");
    try {
      await call(`/api/courses/${course.id}/reviews`, {
        method: "POST",
        body: JSON.stringify({ rating, comment }),
      });
      setMyReview({ rating, comment });
      setReviews((current) => ({
        ...current,
        count: current.count + 1,
        average: Math.round(((current.average * current.count + rating) / (current.count + 1)) * 10) / 10,
      }));
      setNotice("Thanks — your review is published.");
    } catch (err) {
      reportError(err);
    } finally {
      setBusy(false);
    }
  }

  async function issueCertificate() {
    setBusy(true);
    setError("");
    try {
      const data = await call(`/api/courses/${course.id}/certificate`, { method: "POST" });
      const created = data.certificate as {
        certificateId: string;
        finalScore: number;
        issuedAt: string;
      };
      setCertificate({
        id: created.certificateId,
        certificateId: created.certificateId,
        finalScore: created.finalScore,
        issuedAt: created.issuedAt,
        courseTitle: course.title,
        studentName,
      });
      setNotice("Certificate issued. Congratulations!");
      router.refresh();
    } catch (err) {
      reportError(err);
    } finally {
      setBusy(false);
    }
  }

  const eligible = progress.total > 0 && progress.percent === 100 && quiz.passed;

  return (
    <div>
      <Link href={`/courses/${course.id}`} className="text-sm text-muted hover:text-accent-deep">
        ← Course overview
      </Link>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Learning studio
          </p>
          <h1 className="mt-2 font-serif text-3xl">{course.title}</h1>
        </div>
        <div className="w-full max-w-xs">
          <ProgressBar percent={progress.percent} label={`${progress.completed}/${progress.total} lectures complete`} />
        </div>
      </div>

      {notice && <p role="status" className="mt-5 rounded-md border border-olive/30 bg-olive/5 px-4 py-3 text-sm text-olive">{notice}</p>}
      {error && <p role="alert" className="mt-5 rounded-md border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-accent-deep">{error}</p>}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_19rem]">
        <div>
          {tab === "lesson" && selected && (
            <div>
              <div className="flex aspect-video flex-col items-center justify-center rounded-lg border border-line bg-ink px-6 text-center text-paper">
                <PlayIcon className="h-10 w-10 text-accent" />
                <p className="mt-4 font-serif text-xl">{selected.title}</p>
                <p className="mt-2 max-w-md text-xs leading-5 text-paper/60">
                  Video placeholder: {selected.videoUrl || "no media URL supplied"}.
                  Media storage is simulated locally in this reference app.
                </p>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <h2 className="font-serif text-2xl">{selected.title}</h2>
                <span className="flex items-center gap-1 text-xs text-muted">
                  <ClockIcon className="h-4 w-4" /> {selected.duration} min
                </span>
                <button
                  type="button"
                  onClick={toggleComplete}
                  disabled={busy}
                  className={`ml-auto inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-50 ${
                    completed.has(selected.id)
                      ? "bg-olive text-white"
                      : "border border-line bg-surface hover:border-ink"
                  }`}
                >
                  <CheckIcon className="h-4 w-4" />
                  {completed.has(selected.id) ? "Completed" : "Mark complete"}
                </button>
              </div>
              <p className="mt-3 text-sm leading-7 text-muted">
                {selected.description || "Work through this lesson, then mark it complete to update your progress."}
              </p>
            </div>
          )}

          {tab === "quiz" && (
            <div>
              <div className="flex items-center gap-3">
                <QuizIcon className="h-6 w-6 text-accent" />
                <div>
                  <h2 className="font-serif text-2xl">Course quiz</h2>
                  <p className="text-sm text-muted">Passing score is 70%. Best score: {quiz.bestScore}%.</p>
                </div>
              </div>
              {quiz.questions.length === 0 ? (
                <p className="mt-6 rounded-lg border border-dashed border-line bg-surface px-5 py-12 text-center text-sm text-muted">
                  This course does not have a quiz yet.
                </p>
              ) : (
                <div className="mt-6 space-y-5">
                  {quiz.questions.map((question, index) => (
                    <fieldset key={question.id} className="rounded-lg border border-line bg-surface p-5">
                      <legend className="px-1 text-sm font-semibold">
                        {index + 1}. {question.prompt}
                      </legend>
                      <div className="mt-3 space-y-2">
                        {question.options.map((option, optionIndex) => (
                          <label key={optionIndex} className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-paper">
                            <input
                              type="radio"
                              name={`quiz-${question.id}`}
                              checked={answers[question.id] === optionIndex}
                              onChange={() => setAnswers((current) => ({ ...current, [question.id]: optionIndex }))}
                              className="h-4 w-4 accent-[#c4552b]"
                            />
                            {option}
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  ))}
                  <button
                    type="button"
                    onClick={submitQuiz}
                    disabled={busy || Object.keys(answers).length !== quiz.questions.length}
                    className="rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-deep disabled:opacity-50"
                  >
                    {busy ? "Submitting..." : "Submit answers"}
                  </button>
                  {quizResult && (
                    <p className={`text-sm font-semibold ${quizResult.passed ? "text-olive" : "text-accent-deep"}`}>
                      {quizResult.passed ? "Passed" : "Not passed"} — {quizResult.score}%
                    </p>
                  )}
                  {quiz.attempts.length > 0 && (
                    <div className="border-t border-line pt-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Your attempts</p>
                      <ul className="mt-2 space-y-1 text-sm text-muted">
                        {quiz.attempts.slice(0, 5).map((attempt) => (
                          <li key={attempt.id}>
                            {new Date(attempt.attemptedAt).toLocaleDateString()} — {attempt.score}% ({attempt.correctCount}/{attempt.total})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {tab === "review" && (
            <div className="max-w-xl">
              <h2 className="font-serif text-2xl">Your review</h2>
              <p className="mt-2 text-sm text-muted">
                Reviews are available to enrolled learners. One review per course.
              </p>
              <div className="mt-6 rounded-lg border border-line bg-surface p-5">
                <label htmlFor="rating" className="mb-2 block text-sm font-medium">Rating</label>
                <select
                  id="rating"
                  value={rating}
                  onChange={(event) => setRating(Number(event.target.value))}
                  className="rounded-md border border-line bg-paper px-3 py-2 text-sm"
                >
                  {[5, 4, 3, 2, 1].map((value) => (
                    <option key={value} value={value}>{value} stars</option>
                  ))}
                </select>
                <label htmlFor="review-comment" className="mb-2 mt-5 block text-sm font-medium">Comment</label>
                <textarea
                  id="review-comment"
                  rows={5}
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="What worked well, and what could be better?"
                  className="w-full rounded-md border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-accent"
                />
                <button
                  type="button"
                  onClick={submitReview}
                  disabled={busy || Boolean(myReview)}
                  className="mt-4 rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-deep disabled:opacity-50"
                >
                  {myReview ? "Review submitted" : "Publish review"}
                </button>
                {myReview && (
                  <p className="mt-3 flex items-center gap-1 text-sm text-olive">
                    <StarIcon className="h-4 w-4" /> You rated this course {myReview.rating}/5
                  </p>
                )}
              </div>
              <p className="mt-4 text-sm text-muted">
                Course average: {reviews.count ? `${reviews.average.toFixed(1)} from ${reviews.count} reviews` : "no reviews yet"}
              </p>
            </div>
          )}

          {tab === "certificate" && (
            <div className="max-w-xl">
              <h2 className="font-serif text-2xl">Certificate of completion</h2>
              {certificate ? (
                <div className="mt-6 rounded-lg border border-line bg-surface p-8 text-center">
                  <CertificateIcon className="mx-auto h-10 w-10 text-accent" />
                  <p className="mt-4 font-serif text-2xl">Awarded to {studentName}</p>
                  <p className="mt-2 text-sm text-muted">for completing {course.title}</p>
                  <p className="mt-5 font-mono text-xs tracking-wide text-olive">{certificate.certificateId}</p>
                  <p className="mt-2 text-xs text-muted">Final quiz score: {certificate.finalScore}%</p>
                  <Link
                    href={`/certificates/${certificate.certificateId}`}
                    className="mt-6 inline-block rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-paper hover:bg-accent"
                  >
                    View certificate
                  </Link>
                </div>
              ) : (
                <div className="mt-6 rounded-lg border border-line bg-surface p-6">
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-center gap-2">
                      {progress.total > 0 && progress.percent === 100 ? <CheckIcon className="h-5 w-5 text-olive" /> : <span className="h-5 w-5 rounded-full border border-line" />}
                      Complete every lecture ({progress.completed}/{progress.total})
                    </li>
                    <li className="flex items-center gap-2">
                      {quiz.passed ? <CheckIcon className="h-5 w-5 text-olive" /> : <span className="h-5 w-5 rounded-full border border-line" />}
                      Pass the course quiz (best: {quiz.bestScore}%)
                    </li>
                  </ul>
                  <button
                    type="button"
                    onClick={issueCertificate}
                    disabled={busy || !eligible}
                    className="mt-6 rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-deep disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {eligible ? "Issue my certificate" : "Requirements not met"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="flex flex-wrap gap-1 border-b border-line pb-3">
            {(
              [
                ["lesson", "Lessons"],
                ["quiz", "Quiz"],
                ["review", "Review"],
                ["certificate", "Certificate"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => { setTab(value); setError(""); setNotice(""); }}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  tab === value ? "bg-ink text-paper" : "text-muted hover:bg-line"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="mt-4 overflow-hidden rounded-lg border border-line bg-surface">
            {course.sections.map((section) => (
              <div key={section.id}>
                <p className="border-b border-line bg-paper px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted">
                  {section.title}
                </p>
                <ul className="divide-y divide-line">
                  {section.lectures.map((lecture) => (
                    <li key={lecture.id}>
                      <button
                        type="button"
                        onClick={() => { setSelectedId(lecture.id); setTab("lesson"); }}
                        className={`flex w-full items-center gap-2 px-4 py-3 text-left text-sm transition hover:bg-paper ${
                          selectedId === lecture.id ? "bg-accent/5 font-semibold text-accent-deep" : ""
                        }`}
                      >
                        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${completed.has(lecture.id) ? "border-olive bg-olive text-white" : "border-line"}`}>
                          {completed.has(lecture.id) && <CheckIcon className="h-3 w-3" />}
                        </span>
                        <span className="min-w-0 flex-1 truncate">{lecture.title}</span>
                        <span className="text-xs text-muted">{lecture.duration}m</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
