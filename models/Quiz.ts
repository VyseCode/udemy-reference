import { Schema, model, models, type Model, type Types } from "mongoose";

export interface IQuizQuestion {
  _id: Types.ObjectId;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface IQuiz {
  _id: Types.ObjectId;
  course: Types.ObjectId;
  questions: IQuizQuestion[];
  createdAt: Date;
  updatedAt: Date;
}

const quizQuestionSchema = new Schema<IQuizQuestion>(
  {
    prompt: { type: String, required: true, trim: true, maxlength: 500 },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: (value: string[]) => value.length >= 2 && value.length <= 6,
        message: "A question needs between 2 and 6 options",
      },
    },
    correctIndex: { type: Number, required: true, min: 0 },
    explanation: { type: String, default: "" },
  },
  { _id: true },
);

const quizSchema = new Schema<IQuiz>(
  {
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      unique: true,
    },
    questions: { type: [quizQuestionSchema], default: [] },
  },
  { timestamps: true },
);

export const Quiz: Model<IQuiz> =
  (models.Quiz as Model<IQuiz>) || model<IQuiz>("Quiz", quizSchema);
