"use client";

import { BasicStructureWithName } from "@/components/BasicStructureWithName";


export default function Dashboard() {
  return (
    <BasicStructureWithName
      name="Users"
      subHeading="Manage system access and user accounts."
      showBackOption={false}

    >
      <div className="w-full flex flex-col justify-start items-start gap-6">
      </div>
    </BasicStructureWithName>
  );
}
