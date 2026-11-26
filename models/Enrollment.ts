import { Schema, model, models, type Model, type Types } from "mongoose";

export interface IEnrollment {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  course: Types.ObjectId;
  pricePaid: number;
  status: "active";
  createdAt: Date;
  updatedAt: Date;
}

const enrollmentSchema = new Schema<IEnrollment>(
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
    pricePaid: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ["active"], default: "active" },
  },
  { timestamps: true },
);

enrollmentSchema.index({ user: 1, course: 1 }, { unique: true });
enrollmentSchema.index({ course: 1, createdAt: -1 });

export const Enrollment: Model<IEnrollment> =
  (models.Enrollment as Model<IEnrollment>) ||
  model<IEnrollment>("Enrollment", enrollmentSchema);
