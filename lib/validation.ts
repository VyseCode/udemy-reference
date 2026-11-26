import { z } from "zod";

export const courseCreateSchema = z.object({
  title: z.string().trim().min(5, "Title must be at least 5 characters").max(140),
  description: z
    .string()
    .trim()
    .min(20, "Description must be at least 20 characters")
    .max(5000),
  category: z.string().trim().min(2, "Choose a category").max(60),
  price: z.coerce.number().min(0).max(10000).default(0),
  thumbnail: z.union([z.string().url(), z.literal("")]).default(""),
  status: z.enum(["draft", "published"]).default("draft"),
});

export const courseUpdateSchema = z.object({
  title: z.string().trim().min(5, "Title must be at least 5 characters").max(140).optional(),
  description: z
    .string()
    .trim()
    .min(20, "Description must be at least 20 characters")
    .max(5000)
    .optional(),
  category: z.string().trim().min(2).max(60).optional(),
  price: z.coerce.number().min(0).max(10000).optional(),
  thumbnail: z.union([z.string().url(), z.literal("")]).optional(),
  status: z.enum(["draft", "published"]).optional(),
});

export const sectionCreateSchema = z.object({
  title: z.string().trim().min(2, "Section title is required").max(140),
  order: z.coerce.number().int().min(0).optional(),
});

export const sectionUpdateSchema = z.object({
  title: z.string().trim().min(2).max(140).optional(),
  order: z.coerce.number().int().min(0).optional(),
});

const videoUrlSchema = z
  .string()
  .refine(
    (value) => value === "" || /^https:\/\/[^\s]+$/.test(value),
    "Video URL must be an https URL",
  );

export const lectureCreateSchema = z.object({
  title: z.string().trim().min(2, "Lecture title is required").max(140),
  description: z.string().trim().max(2000).default(""),
  order: z.coerce.number().int().min(0).optional(),
  duration: z.coerce.number().int().min(0).max(10000).default(0),
  videoUrl: videoUrlSchema.default(""),
  isPreview: z.boolean().default(false),
});

export const lectureUpdateSchema = lectureCreateSchema.partial();

export const reorderSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, "Provide at least one id"),
});

export const idParamSchema = z.object({
  id: z.string().refine((value) => /^[a-fA-F0-9]{24}$/.test(value), "Invalid id"),
});

export const quizQuestionSchema = z.object({
  prompt: z.string().trim().min(5, "Question prompt is too short").max(500),
  options: z.array(z.string().trim().min(1)).min(2).max(6),
  correctIndex: z.coerce.number().int().min(0),
  explanation: z.string().trim().max(1000).default(""),
});

export const quizCreateSchema = z.object({
  questions: z.array(quizQuestionSchema).min(1, "Add at least one question").max(20),
});

export const quizAttemptSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.string().min(1),
        selectedIndex: z.coerce.number().int().min(0),
      }),
    )
    .min(1, "Answer every question"),
});

export const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(2000).default(""),
});
