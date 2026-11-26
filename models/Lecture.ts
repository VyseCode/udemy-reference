import { Schema, model, models, type Model, type Types } from "mongoose";

export interface ILecture {
  _id: Types.ObjectId;
  course: Types.ObjectId;
  section: Types.ObjectId;
  title: string;
  description: string;
  order: number;
  duration: number;
  videoUrl: string;
  isPreview: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const lectureSchema = new Schema<ILecture>(
  {
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    section: {
      type: Schema.Types.ObjectId,
      ref: "Section",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    description: { type: String, default: "", maxlength: 2000 },
    order: { type: Number, required: true, min: 0 },
    duration: { type: Number, default: 0, min: 0 },
    videoUrl: { type: String, default: "" },
    isPreview: { type: Boolean, default: false },
  },
  { timestamps: true },
);

lectureSchema.index({ section: 1, order: 1 });
lectureSchema.index({ course: 1, order: 1 });

export const Lecture: Model<ILecture> =
  (models.Lecture as Model<ILecture>) ||
  model<ILecture>("Lecture", lectureSchema);
