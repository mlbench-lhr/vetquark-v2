"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export const BasicStructureWithName = ({
  children,
  name,
  subHeading,
  showBackOption = false,
  rightSideComponent,
}: {
  name: string;
  subHeading?: string;
  children: React.ReactNode;
  showBackOption?: boolean;
  rightSideComponent?: React.ReactNode | React.ComponentType<any>;
}) => {
  const router = useRouter();
  const RightSideComponent = rightSideComponent;

  return (
    <div className="w-full flex flex-col justify-start items-start gap-3">
      <div className="flex justify-between items-start md:items-center gap-2 w-full flex-col md:flex-row">
        <div className="flex justify-start items-center gap-2">
          {showBackOption && (
            <div
              onClick={() => router.back()}
              className="pr-2 cursor-pointer"
            >
              <ArrowLeft />
            </div>
          )}
          <div className="">
            <h1 className="text-base md:text-[20px] font-[600] capitalize">
              {name}
            </h1>
            {subHeading ? (
              <span className="text-xs md:text-base font-[400] text-black/70">
                {subHeading}
              </span>
            ) : null}
          </div>
        </div>
        {RightSideComponent &&
          (typeof RightSideComponent === "function" ? (
            <RightSideComponent />
          ) : (
            RightSideComponent
          ))}
      </div>
      <div className="w-full">{children}</div>
    </div>
  );
};
