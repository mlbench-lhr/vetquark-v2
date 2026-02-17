"use client";

import { BasicStructureWithName } from "@/components/BasicStructureWithName";


export default function Dashboard() {
  return (
    <BasicStructureWithName
      name="Overview"
      subHeading="Welcome back, here's what's happening with your veterinary platform today."
      showBackOption={false}

    >
      <div className="w-full flex flex-col justify-start items-start gap-6">
      </div>
    </BasicStructureWithName>
  );
}
