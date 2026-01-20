import {
    UserPlus,
    Stethoscope,
    FileText,
    FileCheck,
    CreditCard,
    Clock,
    XCircle,
} from "lucide-react";
import Header from "@/components/common/header";

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
    { icon: typeof UserPlus; colorClass: string; bgClass: string }
> = {
    "new-patient": {
        icon: UserPlus,
        colorClass: "text-blue-500",
        bgClass: "bg-blue-50",
    },
    "exam-assigned": {
        icon: Stethoscope,
        colorClass: "text-green-500",
        bgClass: "bg-green-50",
    },
    "report-finalised": {
        icon: FileText,
        colorClass: "text-slate-500",
        bgClass: "bg-slate-50",
    },
    "report-signed": {
        icon: FileCheck,
        colorClass: "text-green-600",
        bgClass: "bg-green-50",
    },
    "payment-received": {
        icon: CreditCard,
        colorClass: "text-blue-500",
        bgClass: "bg-blue-50",
    },
    "payment-pending": {
        icon: Clock,
        colorClass: "text-amber-500",
        bgClass: "bg-amber-50",
    },
    "payment-expired": {
        icon: XCircle,
        colorClass: "text-red-500",
        bgClass: "bg-red-50",
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
        <div className="flex items-start gap-3 py-4 border-b border-border last:border-b-0">
            <div
                className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${config.bgClass}`}
            >
                <Icon className={`w-5 h-5 ${config.colorClass}`} />
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-foreground text-sm">
                    {notification.title}
                </h4>
                <p className="text-sm text-muted-foreground mt-0.5">
                    {notification.description}
                </p>
            </div>
            <span className="text-xs text-muted-foreground flex-shrink-0">
                {notification.time}
            </span>
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
        <div className="bg-card rounded-2xl shadow-sm border border-border">
            {groups.map((group, groupIndex) => (
                <div key={group.label}>
                    <div
                        className={`px-4 pt-4 ${groupIndex > 0 ? "mt-2" : ""}`}
                    >
                        <span className="text-xs font-medium text-muted-foreground">
                            {group.label}
                        </span>
                    </div>
                    <div className="px-4">
                        {group.notifications.map((notification) => (
                            <NotificationItem
                                key={notification.id}
                                notification={notification}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function NotificationsPage() {
    return (
        <div className="bg-background min-h-screen flex flex-col">
            <Header title="Notifications" />
            <div className="px-5 pb-8">
                <NotificationList />
            </div>
        </div>
    );
}
