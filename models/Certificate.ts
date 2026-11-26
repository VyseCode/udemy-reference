import { Schema, model, models, type Model, type Types } from "mongoose";

export interface ICertificate {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  course: Types.ObjectId;
  certificateId: string;
  finalScore: number;
  issuedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const certificateSchema = new Schema<ICertificate>(
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
    certificateId: { type: String, required: true, unique: true },
    finalScore: { type: Number, default: 0, min: 0, max: 100 },
    issuedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

certificateSchema.index({ user: 1, course: 1 }, { unique: true });

export const Certificate: Model<ICertificate> =
  (models.Certificate as Model<ICertificate>) ||
  model<ICertificate>("Certificate", certificateSchema);
