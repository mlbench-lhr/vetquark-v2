import { Schema, model, models } from "mongoose";

export type NotificationType = "payment_link";

export interface INotification {
  _id?: string;
  user: Schema.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  url: string;
  readAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ["payment_link"], required: true, index: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    readAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

NotificationSchema.index({ user: 1, createdAt: -1 });

const Notification = models.Notification || model<INotification>("Notification", NotificationSchema);

export default Notification;
