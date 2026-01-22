'use client'

import {
  ChevronLeft,
  Clock,
  CreditCard,
  FileCheck,
  FileText,
  Stethoscope,
  UserPlus,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";

type NotificationType =
  | "new-patient"
  | "exam-assigned"
  | "report-finalised"
  | "report-signed"
  | "payment-received"
  | "payment-pending"
  | "payment-expired";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  time: string;
}

interface NotificationGroup {
  label: string;
  notifications: Notification[];
}

const notificationConfig: Record<
  NotificationType,
  { icon: typeof UserPlus; iconColor: string; bgColor: string }
> = {
  "new-patient": {
    icon: UserPlus,
    iconColor: "#3F78D8",
    bgColor: "#EBF2FF",
  },
  "exam-assigned": {
    icon: Stethoscope,
    iconColor: "#3F78D8",
    bgColor: "#EBF2FF",
  },
  "report-finalised": {
    icon: FileText,
    iconColor: "#3F78D8",
    bgColor: "#EBF2FF",
  },
  "report-signed": {
    icon: FileCheck,
    iconColor: "#22C55E",
    bgColor: "#ECFDF5",
  },
  "payment-received": {
    icon: CreditCard,
    iconColor: "#22C55E",
    bgColor: "#ECFDF5",
  },
  "payment-pending": {
    icon: Clock,
    iconColor: "#F59E0B",
    bgColor: "#FFF7ED",
  },
  "payment-expired": {
    icon: XCircle,
    iconColor: "#EF4444",
    bgColor: "#FEF2F2",
  },
};

const sampleData: NotificationGroup[] = [
  {
    label: "Today",
    notifications: [
      {
        id: "1",
        type: "new-patient",
        title: "New Patient Added",
        description: "Luna was added by João Silva.",
        time: "09:41",
      },
      {
        id: "2",
        type: "exam-assigned",
        title: "New Exam Assigned",
        description: "You are assigned to Luna's examination.",
        time: "10:00",
      },
      {
        id: "3",
        type: "report-finalised",
        title: "Report Finalised",
        description: "Luna's medical report is ready for review.",
        time: "11:30",
      },
      {
        id: "4",
        type: "report-signed",
        title: "Report Signed",
        description: "João Silva has signed Luna's medical report.",
        time: "12:15",
      },
      {
        id: "5",
        type: "payment-received",
        title: "Payment Received",
        description: "Exam payment for Luna is confirmed.",
        time: "14:20",
      },
    ],
  },
  {
    label: "Yesterday",
    notifications: [
      {
        id: "6",
        type: "payment-pending",
        title: "Payment Pending",
        description: "Payment from Ana Oliveira for Thor is outstanding.",
        time: "14:20",
      },
      {
        id: "7",
        type: "payment-expired",
        title: "Payment Expired",
        description: "The payment window for Thor's exam has expired.",
        time: "12:15",
      },
    ],
  },
];

function NotificationItem({ notification }: { notification: Notification }) {
  const config = notificationConfig[notification.type];
  const Icon = config.icon;

  return (
    <div className="flex items-start gap-3 py-4 border-b border-[#F3F4F6] last:border-b-0">
      <div
        className="h-11 w-11 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: config.bgColor }}
      >
        <Icon className="h-5 w-5" style={{ color: config.iconColor }} />
      </div>

      <div className="flex-1 min-w-0 pr-2">
        <div className="text-[14px] leading-[18px] font-semibold text-[#111827]">
          {notification.title}
        </div>
        <div className="mt-1 text-[12px] leading-[16px] text-[#9CA3AF]">
          {notification.description}
        </div>
      </div>

      <div className="text-[12px] leading-[16px] text-[#9CA3AF] flex-shrink-0 pt-0.5">
        {notification.time}
      </div>
    </div>
  );
}

interface NotificationListProps {
  groups?: NotificationGroup[];
}

export function NotificationList({
  groups = sampleData,
}: NotificationListProps) {
  return (
    <div>
      {groups.map((group, groupIndex) => (
        <div key={group.label} className={groupIndex > 0 ? "mt-6" : ""}>
          <div className="text-[14px] leading-[18px] font-medium text-[#9CA3AF]">
            {group.label}
          </div>
          <div className="mt-3">
            {group.notifications.map((notification) => (
              <NotificationItem key={notification.id} notification={notification} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function NotificationsPage() {
  const router = useRouter();
  return (
    <div className="bg-white">
      <div className="px-5 pt-[calc(env(safe-area-inset-top)+14px)] pb-4">
        <div className="relative flex items-center justify-center">
          <button
            type="button"
            onClick={() => router.back()}
            className="absolute left-0 top-1/2 -translate-y-1/2 p-1"
          >
            <ChevronLeft className="h-6 w-6 text-[#111827]" />
          </button>
          <div className="text-[16px] leading-[20px] font-medium text-[#111827]">
            Notifications
          </div>
        </div>
      </div>

      <div className="px-5 pb-8">
        <NotificationList />
      </div>
    </div>
  );
}
