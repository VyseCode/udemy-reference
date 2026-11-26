import { Schema, model, models, type Model, type Types } from "mongoose";

export interface IQuizAnswer {
  questionId: Types.ObjectId;
  selectedIndex: number;
}

export interface IQuizAttempt {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  course: Types.ObjectId;
  answers: IQuizAnswer[];
  correctCount: number;
  total: number;
  score: number;
  passed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const quizAnswerSchema = new Schema<IQuizAnswer>(
  {
    questionId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    selectedIndex: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const quizAttemptSchema = new Schema<IQuizAttempt>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    answers: { type: [quizAnswerSchema], default: [] },
    correctCount: { type: Number, default: 0, min: 0 },
    total: { type: Number, default: 0, min: 0 },
    score: { type: Number, default: 0, min: 0, max: 100 },
    passed: { type: Boolean, default: false },
  },
  { timestamps: true },
);

quizAttemptSchema.index({ user: 1, course: 1, createdAt: -1 });

export const QuizAttempt: Model<IQuizAttempt> =
  (models.QuizAttempt as Model<IQuizAttempt>) ||
  model<IQuizAttempt>("QuizAttempt", quizAttemptSchema);
