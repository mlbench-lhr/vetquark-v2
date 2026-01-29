import { Schema, model, models } from "mongoose";

export type DeviceType = "ios" | "android";

export interface IUserSession {
  _id?: string;
  user: Schema.Types.ObjectId;
  sessionId: string;
  deviceType: DeviceType;
  deviceModel: string;
  createdAt?: Date;
  lastSeenAt?: Date;
  revokedAt?: Date | null;
}

const UserSessionSchema = new Schema<IUserSession>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sessionId: { type: String, required: true, unique: true, index: true },
    deviceType: { type: String, enum: ["ios", "android"], required: true, index: true },
    deviceModel: { type: String, required: true, trim: true },
    lastSeenAt: { type: Date, default: Date.now, index: true },
    revokedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

UserSessionSchema.index({ user: 1, createdAt: -1 });

const UserSession = models.UserSession || model<IUserSession>("UserSession", UserSessionSchema);

export default UserSession;
