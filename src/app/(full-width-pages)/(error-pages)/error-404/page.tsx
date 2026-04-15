"use client";

import GridShape from "@/components/common/GridShape";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { useTranslation } from "react-i18next";

export default function Error404() {
  const { t } = useTranslation();

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen p-6 overflow-hidden z-1">
      <GridShape />
      <div className="mx-auto w-full max-w-[242px] text-center sm:max-w-[472px]">
        <h1 className="mb-8 font-bold text-gray-800 text-title-md  xl:text-title-2xl">
          {t("common.error404Title")}
        </h1>

        <Image
          src="/images/error/404.svg"
          alt="404"
          className=""
          width={472}
          height={152}
        />

        <p className="mt-10 mb-6 text-base text-gray-700  sm:text-lg">
          {t("common.error404Message")}
        </p>

        <Link
          href="/signin"
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-3.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 "
        >
          {t("common.backToHome")}
        </Link>
      </div>
    </div>
  );
}
