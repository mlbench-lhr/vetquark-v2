import GridShape from "@/components/common/GridShape";
import ThemeTogglerTwo from "@/components/common/ThemeTogglerTwo";

import { ThemeProvider } from "@/context/ThemeContext";
import Image from "next/image";
import Link from "next/link";
import React, { Suspense } from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <div className="relative  bg-white z-1  sm:p-0">
        <ThemeProvider>
          <div className="relative flex lg:flex-row w-full justify-center flex-col sm:p-0 p-4">
            {children}
            {/* <div className="lg:w-1/2 w-full h-full  bg-[#4958E9] lg:grid items-center hidden">
            <div className="relative items-center justify-center  flex z-1">
              <GridShape />
              <div className="flex flex-col items-center max-w-md">
                <Link href="/" className="block mb-4">
                  <Image
                    width={105}
                    height={20}
                    className=""
                    src="/images/pasapo_logo_white.svg"
                    alt="Logo"
                  />
                </Link>
                <p className="text-center text-white">
                  Pasaport ve kimlik tarayıp KBS’ye bildirmeye başlamak için aşağıdaki seçeneklerden birine dokunun.
                </p>
              </div>
            </div>
          </div> */}
            {/* <div className="fixed bottom-6 right-6 z-50 hidden sm:block">
            <ThemeTogglerTwo />
          </div> */}
          </div>
        </ThemeProvider>
      </div>
    </Suspense>

  );
}
