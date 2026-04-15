"use client";

import Image from "next/image";
import { useTranslation } from "react-i18next";

interface NoDataComponentProps {
  text?: string;
  actionComponent?: React.ReactNode | React.ComponentType<any>;
}

export const NoDataComponent = ({
  text,
  actionComponent,
}: NoDataComponentProps) => {
  const { t } = useTranslation();
  const displayText = text ?? t("common.noDataFound");
  const ActionComponent = actionComponent;

  return (
    <div
      className={`leading-tight text-xs md:text-base text-black/70 font-medium flex flex-col justify-center items-center gap-2`}
    >
      {/* <Image
        src={"/noDataFoundIcon.png"}
        width={220}
        height={220}
        alt="no-data"
        className="w-[120px] h-[120px] md:h-[220px] md:w-[220px] object-contain"
      /> */}
      {displayText}
      {ActionComponent &&
        (typeof ActionComponent === "function" ? (
          <ActionComponent />
        ) : (
          ActionComponent
        ))}
    </div>
  );
};
