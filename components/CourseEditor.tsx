"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowRightIcon,
  CheckIcon,
  DownIcon,
  PlusIcon,
  QuizIcon,
  TrashIcon,
  UpIcon,
} from "@/components/Icons";
import type { CourseDetailDTO, SectionDTO } from "@/lib/types";

type Props = {
  mode: "create" | "edit";
  categories: string[];
  initial?: CourseDetailDTO;
  quizQuestions?: Array<{
    id: string;
    prompt: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }>;
};

type Question = {
  id?: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

const blankQuestion = (): Question => ({
  prompt: "",
  options: ["", "", "", ""],
  correctIndex: 0,
  explanation: "",
});

export function CourseEditor({ mode, categories, initial, quizQuestions }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<"details" | "curriculum" | "quiz">("details");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    category: initial?.category ?? categories[0] ?? "Web Development",
    price: String(initial?.price ?? 0),
    thumbnail: initial?.thumbnail ?? "",
    status: initial?.status ?? ("draft" as "draft" | "published"),
  });
  const [sections, setSections] = useState<SectionDTO[]>(initial?.sections ?? []);
  const [questions, setQuestions] = useState<Question[]>(
    quizQuestions?.length ? quizQuestions : initial ? [] : [blankQuestion()],
  );
  const [newSection, setNewSection] = useState("");
  const [lectureDraft, setLectureDraft] = useState<Record<string, { title: string; duration: string; videoUrl: string; isPreview: boolean }>>({});

  const courseId = initial?.id;

  async function call(path: string, options: RequestInit): Promise<{ ok: boolean; data: Record<string, unknown> }> {
    const response = await fetch(path, {
      ...options,
      headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
    });
    const data = (await response.json()) as Record<string, unknown>;
    if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "Request failed");
    return { ok: response.ok, data };
  }

  function reportError(err: unknown) {
    setError(err instanceof Error ? err.message : "Something went wrong");
    setNotice("");
  }

  function done(message: string) {
    setError("");
    setNotice(message);
    router.refresh();
  }

  async function saveDetails(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        category: form.category,
        price: Number(form.price),
        thumbnail: form.thumbnail,
        status: form.status,
      };
      if (mode === "create") {
        const { data } = await call("/api/courses", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        const course = data.course as CourseDetailDTO;
        router.push(`/teach/courses/${course.id}`);
      } else {
        await call(`/api/courses/${courseId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        done("Course details saved.");
      }
    } catch (err) {
      reportError(err);
    } finally {
      setBusy(false);
    }
  }

  async function addSection() {
    if (!courseId || !newSection.trim()) return;
    setBusy(true);
    try {
      const { data } = await call(`/api/courses/${courseId}/sections`, {
        method: "POST",
        body: JSON.stringify({ title: newSection.trim() }),
      });
      const section = data.section as { id: string; title: string; order: number };
      setSections((current) => [...current, { ...section, lectures: [] }]);
      setNewSection("");
      done("Section added.");
    } catch (err) {
      reportError(err);
    } finally {
      setBusy(false);
    }
  }

  async function removeSection(sectionId: string) {
    if (!courseId || !window.confirm("Delete this section and all its lectures?")) return;
    setBusy(true);
    try {
      await call(`/api/sections/${sectionId}`, { method: "DELETE" });
      setSections((current) => current.filter((section) => section.id !== sectionId));
      done("Section deleted.");
    } catch (err) {
      reportError(err);
    } finally {
      setBusy(false);
    }
  }

  async function moveSection(index: number, direction: -1 | 1) {
    if (!courseId) return;
    const target = index + direction;
    if (target < 0 || target >= sections.length) return;
    const next = [...sections];
    [next[index], next[target]] = [next[target], next[index]];
    setSections(next);
    try {
      await call(`/api/courses/${courseId}/sections/reorder`, {
        method: "POST",
        body: JSON.stringify({ ids: next.map((section) => section.id) }),
      });
      done("Section order saved.");
    } catch (err) {
      reportError(err);
      setSections(sections);
    }
  }

  async function addLecture(sectionId: string) {
    const draft = lectureDraft[sectionId] ?? { title: "", duration: "5", videoUrl: "", isPreview: false };
    if (!draft.title.trim()) {
      setError("Give the lecture a title first.");
      return;
    }
    setBusy(true);
    try {
      const { data } = await call(`/api/sections/${sectionId}/lectures`, {
        method: "POST",
        body: JSON.stringify({
          title: draft.title.trim(),
          duration: Number(draft.duration) || 0,
          videoUrl: draft.videoUrl.trim(),
          isPreview: draft.isPreview,
        }),
      });
      const lecture = data.lecture as { id: string };
      setSections((current) =>
        current.map((section) =>
          section.id === sectionId
            ? {
                ...section,
                lectures: [
                  ...section.lectures,
                  {
                    id: lecture.id,
                    title: draft.title.trim(),
                    description: "",
                    order: section.lectures.length,
                    duration: Number(draft.duration) || 0,
                    isPreview: draft.isPreview,
                    videoUrl: draft.videoUrl.trim(),
                  },
                ],
              }
            : section,
        ),
      );
      setLectureDraft((current) => ({ ...current, [sectionId]: { title: "", duration: "5", videoUrl: "", isPreview: false } }));
      done("Lecture added.");
    } catch (err) {
      reportError(err);
    } finally {
      setBusy(false);
    }
  }

  async function removeLecture(lectureId: string) {
    if (!window.confirm("Delete this lecture?")) return;
    setBusy(true);
    try {
      await call(`/api/lectures/${lectureId}`, { method: "DELETE" });
      setSections((current) =>
        current.map((section) => ({
          ...section,
          lectures: section.lectures.filter((lecture) => lecture.id !== lectureId),
        })),
      );
      done("Lecture deleted.");
    } catch (err) {
      reportError(err);
    } finally {
      setBusy(false);
    }
  }

  async function togglePreview(sectionId: string, lectureId: string, isPreview: boolean) {
    try {
      await call(`/api/lectures/${lectureId}`, {
        method: "PATCH",
        body: JSON.stringify({ isPreview }),
      });
      setSections((current) =>
        current.map((section) =>
          section.id === sectionId
            ? {
                ...section,
                lectures: section.lectures.map((lecture) =>
                  lecture.id === lectureId ? { ...lecture, isPreview } : lecture,
                ),
              }
            : section,
        ),
      );
      done(isPreview ? "Lecture marked as preview." : "Preview removed.");
    } catch (err) {
      reportError(err);
    }
  }

  async function moveLecture(sectionId: string, index: number, direction: -1 | 1) {
    const section = sections.find((item) => item.id === sectionId);
    if (!section) return;
    const target = index + direction;
    if (target < 0 || target >= section.lectures.length) return;
    const nextLectures = [...section.lectures];
    [nextLectures[index], nextLectures[target]] = [nextLectures[target], nextLectures[index]];
    setSections((current) =>
      current.map((item) => (item.id === sectionId ? { ...item, lectures: nextLectures } : item)),
    );
    try {
      await call(`/api/sections/${sectionId}/lectures/reorder`, {
        method: "POST",
        body: JSON.stringify({ ids: nextLectures.map((lecture) => lecture.id) }),
      });
      done("Lecture order saved.");
    } catch (err) {
      reportError(err);
      router.refresh();
    }
  }

  async function saveQuiz() {
    if (!courseId) return;
    setBusy(true);
    try {
      await call(`/api/courses/${courseId}/quiz`, {
        method: "PUT",
        body: JSON.stringify({
          questions: questions.map((question) => ({
            prompt: question.prompt,
            options: question.options,
            correctIndex: Number(question.correctIndex),
            explanation: question.explanation,
          })),
        }),
      });
      done("Quiz saved.");
    } catch (err) {
      reportError(err);
    } finally {
      setBusy(false);
    }
  }

  function updateQuestion(index: number, patch: Partial<Question>) {
    setQuestions((current) =>
      current.map((question, position) => (position === index ? { ...question, ...patch } : question)),
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 border-b border-line">
        {(
          [
            ["details", "Course details"],
            ["curriculum", "Curriculum"],
            ["quiz", "Quiz"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => { setTab(value); setError(""); setNotice(""); }}
            className={`-mb-px border-b-2 px-3 py-3 text-sm font-medium transition ${
              tab === value
                ? "border-accent text-accent-deep"
                : "border-transparent text-muted hover:text-ink"
            } ${value !== "details" && mode === "create" ? "opacity-50" : ""}`}
            disabled={value !== "details" && mode === "create"}
          >
            {label}
          </button>
        ))}
      </div>

      {notice && (
        <p role="status" className="mt-5 flex items-center gap-2 rounded-md border border-olive/30 bg-olive/5 px-4 py-3 text-sm text-olive">
          <CheckIcon className="h-4 w-4" /> {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-5 rounded-md border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-accent-deep">
          {error}
        </p>
      )}

      {tab === "details" && (
        <form onSubmit={saveDetails} className="mt-8 max-w-2xl space-y-5">
          <div>
            <label htmlFor="title" className="mb-1.5 block text-sm font-medium">Course title</label>
            <input id="title" required minLength={5} maxLength={140} value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              placeholder="e.g. Practical TypeScript for product teams"
              className="w-full rounded-md border border-line bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent" />
          </div>
          <div>
            <label htmlFor="description" className="mb-1.5 block text-sm font-medium">Description</label>
            <textarea id="description" required minLength={20} maxLength={5000} rows={5}
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              placeholder="What will learners be able to do when they finish?"
              className="w-full rounded-md border border-line bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent" />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="category" className="mb-1.5 block text-sm font-medium">Category</label>
              <input id="category" required list="categories" value={form.category}
                onChange={(event) => setForm({ ...form, category: event.target.value })}
                className="w-full rounded-md border border-line bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent" />
              <datalist id="categories">
                {categories.map((category) => <option key={category} value={category} />)}
              </datalist>
            </div>
            <div>
              <label htmlFor="price" className="mb-1.5 block text-sm font-medium">Price (USD)</label>
              <input id="price" type="number" min={0} max={10000} step="0.01" value={form.price}
                onChange={(event) => setForm({ ...form, price: event.target.value })}
                className="w-full rounded-md border border-line bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent" />
            </div>
          </div>
          <div>
            <label htmlFor="thumbnail" className="mb-1.5 block text-sm font-medium">Thumbnail URL (optional)</label>
            <input id="thumbnail" type="url" value={form.thumbnail}
              onChange={(event) => setForm({ ...form, thumbnail: event.target.value })}
              placeholder="https://..."
              className="w-full rounded-md border border-line bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent" />
          </div>
          <label className="flex cursor-pointer items-center gap-3 rounded-md border border-line bg-surface px-4 py-3 text-sm">
            <input type="checkbox" checked={form.status === "published"}
              onChange={(event) => setForm({ ...form, status: event.target.checked ? "published" : "draft" })}
              className="h-4 w-4 accent-[#c4552b]" />
            Published (visible in the catalog)
          </label>
          <button type="submit" disabled={busy}
            className="inline-flex items-center gap-2 rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-deep disabled:opacity-60">
            {mode === "create" ? "Create course" : "Save details"} <ArrowRightIcon className="h-4 w-4" />
          </button>
        </form>
      )}

      {tab === "curriculum" && (
        <div className="mt-8 max-w-3xl space-y-6">
          <div className="flex gap-2">
            <label htmlFor="new-section" className="sr-only">New section title</label>
            <input id="new-section" value={newSection}
              onChange={(event) => setNewSection(event.target.value)}
              placeholder="New section title"
              className="flex-1 rounded-md border border-line bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent" />
            <button type="button" onClick={addSection} disabled={busy || !newSection.trim()}
              className="inline-flex items-center gap-1.5 rounded-md border border-line px-4 py-2.5 text-sm font-semibold hover:border-ink disabled:opacity-50">
              <PlusIcon className="h-4 w-4" /> Add section
            </button>
          </div>

          {sections.length === 0 ? (
            <p className="rounded-lg border border-dashed border-line bg-surface px-5 py-12 text-center text-sm text-muted">
              No sections yet. Add your first section, then fill it with lectures.
            </p>
          ) : (
            sections.map((section, sectionIndex) => {
              const draft = lectureDraft[section.id] ?? { title: "", duration: "5", videoUrl: "", isPreview: false };
              return (
                <section key={section.id} className="overflow-hidden rounded-lg border border-line bg-surface">
                  <div className="flex items-center gap-2 border-b border-line bg-paper px-4 py-3">
                    <span className="font-serif text-lg">{section.title}</span>
                    <span className="text-xs text-muted">{section.lectures.length} lectures</span>
                    <div className="ml-auto flex items-center gap-1">
                      <button type="button" aria-label="Move section up" disabled={sectionIndex === 0}
                        onClick={() => moveSection(sectionIndex, -1)} className="rounded p-1.5 text-muted hover:bg-line disabled:opacity-30">
                        <UpIcon className="h-4 w-4" />
                      </button>
                      <button type="button" aria-label="Move section down" disabled={sectionIndex === sections.length - 1}
                        onClick={() => moveSection(sectionIndex, 1)} className="rounded p-1.5 text-muted hover:bg-line disabled:opacity-30">
                        <DownIcon className="h-4 w-4" />
                      </button>
                      <button type="button" aria-label="Delete section" onClick={() => removeSection(section.id)}
                        className="rounded p-1.5 text-muted hover:bg-line hover:text-accent">
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <ul className="divide-y divide-line">
                    {section.lectures.map((lecture, lectureIndex) => (
                      <li key={lecture.id} className="flex flex-wrap items-center gap-2 px-4 py-3 text-sm">
                        <span className="w-5 text-xs text-muted">{lectureIndex + 1}.</span>
                        <span className="min-w-0 flex-1 truncate">{lecture.title}</span>
                        <span className="text-xs text-muted">{lecture.duration}m</span>
                        <button type="button"
                          onClick={() => togglePreview(section.id, lecture.id, !lecture.isPreview)}
                          className={`rounded px-2 py-1 text-xs ${lecture.isPreview ? "bg-olive/10 text-olive" : "text-muted hover:bg-line"}`}>
                          {lecture.isPreview ? "Preview" : "Set preview"}
                        </button>
                        <button type="button" aria-label="Move lecture up" disabled={lectureIndex === 0}
                          onClick={() => moveLecture(section.id, lectureIndex, -1)} className="rounded p-1.5 text-muted hover:bg-line disabled:opacity-30">
                          <UpIcon className="h-4 w-4" />
                        </button>
                        <button type="button" aria-label="Move lecture down" disabled={lectureIndex === section.lectures.length - 1}
                          onClick={() => moveLecture(section.id, lectureIndex, 1)} className="rounded p-1.5 text-muted hover:bg-line disabled:opacity-30">
                          <DownIcon className="h-4 w-4" />
                        </button>
                        <button type="button" aria-label="Delete lecture" onClick={() => removeLecture(lecture.id)}
                          className="rounded p-1.5 text-muted hover:bg-line hover:text-accent">
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div className="grid gap-2 border-t border-line bg-paper/60 p-4 sm:grid-cols-[1fr_5rem_1fr_auto]">
                    <input aria-label={`New lecture title in ${section.title}`} value={draft.title}
                      onChange={(event) => setLectureDraft((current) => ({ ...current, [section.id]: { ...draft, title: event.target.value } }))}
                      placeholder="Lecture title" className="rounded-md border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent" />
                    <input aria-label={`Duration in minutes for ${section.title}`} type="number" min={0} value={draft.duration}
                      onChange={(event) => setLectureDraft((current) => ({ ...current, [section.id]: { ...draft, duration: event.target.value } }))}
                      className="rounded-md border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent" />
                    <input aria-label={`Video placeholder URL in ${section.title}`} value={draft.videoUrl}
                      onChange={(event) => setLectureDraft((current) => ({ ...current, [section.id]: { ...draft, videoUrl: event.target.value } }))}
                      placeholder="https://media.../clip.mp4" className="rounded-md border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent" />
                    <button type="button" onClick={() => addLecture(section.id)} disabled={busy}
                      className="inline-flex items-center gap-1.5 rounded-md bg-ink px-3 py-2 text-sm font-semibold text-paper hover:bg-accent disabled:opacity-50">
                      <PlusIcon className="h-4 w-4" /> Add
                    </button>
                  </div>
                </section>
              );
            })
          )}
        </div>
      )}

      {tab === "quiz" && (
        <div className="mt-8 max-w-3xl space-y-5">
          <p className="text-sm text-muted">
            Learners need a passing score of 70% on this quiz to earn a certificate.
          </p>
          {questions.map((question, index) => (
            <div key={index} className="rounded-lg border border-line bg-surface p-5">
              <div className="mb-3 flex items-center gap-2">
                <QuizIcon className="h-5 w-5 text-accent" />
                <span className="font-semibold">Question {index + 1}</span>
                {question.id && <span className="text-xs text-muted">saved</span>}
                <button type="button" aria-label={`Remove question ${index + 1}`} onClick={() => setQuestions((current) => current.filter((_, position) => position !== index))}
                  className="ml-auto rounded p-1.5 text-muted hover:text-accent"><TrashIcon className="h-4 w-4" /></button>
              </div>
              <input aria-label={`Prompt for question ${index + 1}`} value={question.prompt}
                onChange={(event) => updateQuestion(index, { prompt: event.target.value })}
                placeholder="Ask a question about the course material"
                className="w-full rounded-md border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-accent" />
              <div className="mt-3 space-y-2">
                {question.options.map((option, optionIndex) => (
                  <label key={optionIndex} className="flex items-center gap-2 text-sm">
                    <input type="radio" name={`correct-${index}`} checked={question.correctIndex === optionIndex}
                      onChange={() => updateQuestion(index, { correctIndex: optionIndex })}
                      className="h-4 w-4 accent-[#c4552b]" />
                    <span className="w-4 text-xs text-muted">{String.fromCharCode(65 + optionIndex)}</span>
                    <input aria-label={`Option ${optionIndex + 1} for question ${index + 1}`} value={option}
                      onChange={(event) => {
                        const options = [...question.options];
                        options[optionIndex] = event.target.value;
                        updateQuestion(index, { options });
                      }}
                      className="flex-1 rounded-md border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-accent" />
                  </label>
                ))}
              </div>
              <input aria-label={`Explanation for question ${index + 1}`} value={question.explanation}
                onChange={(event) => updateQuestion(index, { explanation: event.target.value })}
                placeholder="Explanation (optional)"
                className="mt-3 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-accent" />
            </div>
          ))}
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => setQuestions((current) => [...current, blankQuestion()])}
              className="inline-flex items-center gap-1.5 rounded-md border border-line px-4 py-2.5 text-sm font-semibold hover:border-ink">
              <PlusIcon className="h-4 w-4" /> Add question
            </button>
            <button type="button" onClick={saveQuiz} disabled={busy || questions.length === 0}
              className="rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-deep disabled:opacity-50">
              Save quiz
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
