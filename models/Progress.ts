import { Schema, model, models, type Model, type Types } from "mongoose";

export interface IProgress {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  course: Types.ObjectId;
  lecture: Types.ObjectId;
  completed: boolean;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const progressSchema = new Schema<IProgress>(
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
    lecture: {
      type: Schema.Types.ObjectId,
      ref: "Lecture",
      required: true,
      index: true,
    },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

progressSchema.index({ user: 1, lecture: 1 }, { unique: true });
progressSchema.index({ user: 1, course: 1 });

export const Progress: Model<IProgress> =
  (models.Progress as Model<IProgress>) ||
  model<IProgress>("Progress", progressSchema);
