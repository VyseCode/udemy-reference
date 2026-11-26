import { Schema, model, models, type Model, type Types } from "mongoose";

export interface ISection {
  _id: Types.ObjectId;
  course: Types.ObjectId;
  title: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const sectionSchema = new Schema<ISection>(
  {
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    order: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
);

sectionSchema.index({ course: 1, order: 1 });

export const Section: Model<ISection> =
  (models.Section as Model<ISection>) ||
  model<ISection>("Section", sectionSchema);
