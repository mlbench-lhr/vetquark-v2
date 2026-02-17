"use client";

import { BasicStructureWithName } from "@/components/BasicStructureWithName";


export default function Dashboard() {
  return (
    <BasicStructureWithName
      name="Orders & Deliveries"
      subHeading="Track and manage product orders, shipments, and logistics."
      showBackOption={false}

    >
      <div className="w-full flex flex-col justify-start items-start gap-6">
      </div>
    </BasicStructureWithName>
  );
}
