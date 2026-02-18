"use client";

import { BasicStructureWithName } from "@/components/BasicStructureWithName";
import { BoxProviderWithName } from "@/components/BoxProviderWithName";
import { NoDataComponent } from "@/components/NoDataComponent";
import { ServerPaginationProvider } from "@/components/PaginationProvider";
import { SearchComponent } from "@/components/SearchComponent";
import { Column, DynamicTable } from "@/components/Table/page";
import { Copy, Eye, Trash } from "lucide-react";
import { format } from "date-fns";
import { useMemo, useState } from "react";
import { toast } from "react-toastify";

type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  crmvOrStateLabel: string;
  exams: number;
  joined: string | null;
};

export default function Dashboard() {
  const [search, setSearch] = useState<string>("");
  const [activeRole, setActiveRole] = useState<"Veterinarian" | "Guardian">("Veterinarian");

  const queryParams = useMemo(() => ({ search, role: activeRole }), [search, activeRole]);

  const LoadingSkeleton = () => (
    <div className="w-full space-y-2 animate-pulse">
      {[...Array(7)].map((_, i) => (
        <div key={i} className="h-10 md:h-16 bg-gray-200 rounded-lg" />
      ))}
    </div>
  );

  const NoUsersFound = () => (
    <NoDataComponent text={`No ${activeRole === "Veterinarian" ? "Veterinarians" : "Guardians"} Yet`} />
  );

  return (
    <BasicStructureWithName
      name="Users"
      subHeading="Manage system access and user accounts."
      showBackOption={false}

    >
      <div className="w-full flex flex-col justify-start items-start gap-6">
        <SearchComponent searchQuery={search} onChangeFunc={setSearch} />

        <div className="w-full border-b border-gray-200 flex items-center gap-6">
          <button
            type="button"
            onClick={() => setActiveRole("Veterinarian")}
            className={`py-2 text-sm font-medium ${activeRole === "Veterinarian" ? "text-primary border-b-2 border-primary" : "text-gray-500"
              }`}
          >
            Veterinarians
          </button>
          <button
            type="button"
            onClick={() => setActiveRole("Guardian")}
            className={`py-2 text-sm font-medium ${activeRole === "Guardian" ? "text-primary border-b-2 border-primary" : "text-gray-500"
              }`}
          >
            Guardians
          </button>
        </div>

        <BoxProviderWithName >
          <ServerPaginationProvider<AdminUserRow>
            apiEndpoint="/api/admin/users"
            queryParams={queryParams}
            LoadingComponent={LoadingSkeleton}
            NoDataComponent={NoUsersFound}
            itemsPerPage={7}
          >
            {(data, isLoading) => {
              const columns: Column[] = [
                {
                  header: "Veterinarian",
                  accessor: "name",
                  render: (item) => <span>{String(item?.name ?? "")}</span>,
                },
                {
                  header: "CRMV / State",
                  accessor: "crmvOrStateLabel",
                  render: (item) => <span>{String(item?.crmvOrStateLabel ?? "—")}</span>,
                },
                {
                  header: "Email",
                  accessor: "email",
                  render: (item) => <span>{String(item?.email ?? "")}</span>,
                },
                {
                  header: "Exams",
                  accessor: "exams",
                  render: (item) => {
                    const n = Number(item?.exams);
                    const safe = Number.isFinite(n) ? n : 0;
                    return <span>{safe}</span>;
                  },
                },
                {
                  header: "Joined",
                  accessor: "joined",
                  render: (item) => {
                    const raw = item?.joined;
                    const d = raw ? new Date(String(raw)) : null;
                    if (!d || Number.isNaN(d.getTime())) return <span>—</span>;
                    return <span>{format(d, "MMM dd, yyyy")}</span>;
                  },
                },
                {
                  header: "Actions",
                  accessor: "id",
                  render: (item) => {
                    const id = String(item?.id ?? "");
                    return (
                      <div className="flex justify-start items-center gap-2">
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-gray-700 hover:bg-gray-100"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-gray-700 hover:bg-gray-100"
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    );
                  },
                },
              ];

              return (
                <DynamicTable
                  data={data}
                  columns={columns}
                  itemsPerPage={7}
                  isLoading={isLoading}
                />
              );
            }}
          </ServerPaginationProvider>
        </BoxProviderWithName>
      </div>
    </BasicStructureWithName>
  );
}
