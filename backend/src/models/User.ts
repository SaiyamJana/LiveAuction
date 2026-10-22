import { Schema, model } from "mongoose";
import { USER_ROLES, UserRole } from "../types/enums.js";

export interface IUser {
  username: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  secureCodeHash: string;
  tokenVersion: number;
  failedAttempts: number;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: USER_ROLES, default: "user", required: true },
    secureCodeHash: { type: String, required: true, select: false },
    tokenVersion: { type: Number, default: 0, min: 0 },
    failedAttempts: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret.passwordHash;
        delete ret.secureCodeHash;
        return ret;
      },
    },
  }
);

// Only one owner account may exist
userSchema.index(
  { role: 1 },
  { unique: true, partialFilterExpression: { role: "owner" } }
);

export const User = model<IUser>("User", userSchema);