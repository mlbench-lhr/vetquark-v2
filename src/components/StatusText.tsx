"use client";

import { useTranslation } from "react-i18next";

const variants: any = {
  upcoming: { text: "#008EFF", key: "upcoming" },
  "in-progress": { text: "#008EFF", key: "inProgress" },
  completed: { text: "#4A9E35", key: "completed" },
  Eligible: { text: "#4A9E35", key: "eligible" },
  "Not Eligible": { text: "#F5A903", key: "notEligible" },
  pending: { text: "#FF862F", key: "pending" },
  cancelled: { text: "rgba(255, 0, 0, 0.60)", key: "cancelled" },
  missed: { text: "red", key: "missed" },
  active: { text: "#4A9E35", key: "active" },
  Active: { text: "#4A9E35", key: "active" },
  inactive: { text: "rgba(255, 0, 0, 0.60)", key: "inactive" },
  Inactive: { text: "rgba(255, 0, 0, 0.60)", key: "inactive" },
};

export const StatusText = ({ status }: { status: string }) => {
  const { t } = useTranslation();
  const variant = variants[status];

  return (
    <div
      className={`leading-tight text-xs md:text-base font-normal capitalize`}
      style={{
        color: variant?.text,
      }}
    >
      {variant?.key ? t(`common.${variant.key}`) : status}
    </div>
  );
};
