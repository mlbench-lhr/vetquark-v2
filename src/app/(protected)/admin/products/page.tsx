"use client";

import { BasicStructureWithName } from "@/components/BasicStructureWithName";
import { SearchComponent } from "@/components/SearchComponent";
import { useState } from "react";


export default function Dashboard() {
  const [search, setSearch] = useState<string>("");
  return (
    <BasicStructureWithName
      name="Products"
      subHeading="Manage your inventory, pricing, and product details."
      showBackOption={false}

    >
      <SearchComponent
        searchQuery={search}
        onChangeFunc={setSearch}
      />
    </BasicStructureWithName>
  );
}
