"use client";

import { BasicStructureWithName } from "@/components/BasicStructureWithName";


export default function Dashboard() {
  return (
    <BasicStructureWithName
      name="Products"
      subHeading="Manage your inventory, pricing, and product details."
      showBackOption={false}

    >
      <div className="w-full flex flex-col justify-start items-start gap-6">
      </div>
    </BasicStructureWithName>
  );
}
