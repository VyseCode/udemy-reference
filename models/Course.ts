import { Schema, model, models, type Model, type Types } from "mongoose";

export type CourseStatus = "draft" | "published";

export interface ICourse {
  _id: Types.ObjectId;
  instructor: Types.ObjectId;
  title: string;
  description: string;
  category: string;
  price: number;
  thumbnail: string;
  enrollmentCount: number;
  status: CourseStatus;
  createdAt: Date;
  updatedAt: Date;
}

const courseSchema = new Schema<ICourse>(
  {
    instructor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    category: { type: String, required: true, trim: true, index: true },
    price: { type: Number, default: 0, min: 0 },
    thumbnail: { type: String, default: "" },
    enrollmentCount: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
      index: true,
    },
  },
  { timestamps: true },
);

courseSchema.index({ status: 1, createdAt: -1 });
courseSchema.index({ status: 1, price: 1 });
courseSchema.index({ status: 1, enrollmentCount: -1 });
courseSchema.index({ category: 1, status: 1 });
courseSchema.index({ instructor: 1, updatedAt: -1 });
courseSchema.index({ title: "text", description: "text", category: "text" });

export const Course: Model<ICourse> =
  (models.Course as Model<ICourse>) || model<ICourse>("Course", courseSchema);
