import { Schema, model, models, type Model, type Types } from "mongoose";

export type UserRole = "student" | "instructor";

export interface IUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  headline: string;
  bio: string;
  avatarUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["student", "instructor"],
      default: "student",
      index: true,
    },
    headline: { type: String, default: "", maxlength: 140 },
    bio: { type: String, default: "", maxlength: 2000 },
    avatarUrl: { type: String, default: "" },
  },
  { timestamps: true },
);

export const User: Model<IUser> =
  (models.User as Model<IUser>) || model<IUser>("User", userSchema);
