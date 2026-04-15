import Image from "next/image";
import React from "react";
import { useTranslation } from "react-i18next";

export default function GridShape() {
  const { t } = useTranslation();
  return (
    <>
      <div className="absolute z-1 w-full">
        <Image
          width={2080}
          height={254}
          src="/images/grid.svg"
          alt={t("common.gridAlt")}
        />

      </div>
    </>
  );
}
