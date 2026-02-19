"use client";

import { BasicStructureWithName } from "@/components/BasicStructureWithName";
import { BoxProviderWithName } from "@/components/BoxProviderWithName";
import { NoDataComponent } from "@/components/NoDataComponent";
import { ServerPaginationProvider } from "@/components/PaginationProvider";
import { SearchComponent } from "@/components/SearchComponent";
import { useMemo, useRef, useState } from "react";
import { Column, DynamicTable } from "@/components/Table/page";
import { StatusText } from "@/components/StatusText";
import { format } from "date-fns";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import AddEditProductModal from "@/components/AddEditProductModal";
import Swal from "sweetalert2";

type AdminProductRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  image: string;
  active: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  unitPrice: number;
  price: number;
  stock: number;
  status: string;
  lastUpdated: string | null;
};
export default function Dashboard() {
  const [search, setSearch] = useState<string>("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProductRow | null>(null);
  const refetchRef = useRef<null | (() => void)>(null);

  const queryParams = useMemo(() => ({ search }), [search]);
  const BookingsLoadingSkeleton = () => (
    <div className="w-full space-y-2 animate-pulse">
      {[...Array(7)].map((_, i) => (
        <div key={i} className="h-10 md:h-16 bg-gray-200 rounded-lg" />
      ))}
    </div>
  );

  const NoBookingsFound = () => (
    <NoDataComponent text="No Products Yet" />
  );
  return (
    <BasicStructureWithName
      name="Products"
      subHeading="Manage your inventory, pricing, and product details."
      showBackOption={false}

    >
      <div className="flex justify-start items-center gap-y-1.5 gap-x-3 flex-col sm:flex-row w-full md:w-fit">
        <SearchComponent
          searchQuery={search}
          onChangeFunc={setSearch}
        />
        <Button
          variant={"default"}
          size={"lg"}
          type="button"
          onClick={() => {
            setEditingProduct(null);
            setModalOpen(true);
          }}
          className="w-full md:w-fit"
        >
          <Plus />
          Add Product
        </Button>
      </div>
      <BoxProviderWithName
      // noBorder={true}
      // className="p-0!"
      >
        <ServerPaginationProvider<AdminProductRow>
          apiEndpoint="/api/admin/products"
          queryParams={queryParams}
          LoadingComponent={BookingsLoadingSkeleton}
          NoDataComponent={NoBookingsFound}
          itemsPerPage={7}
        >
          {(data, isLoading, refetch) => {
            refetchRef.current = refetch;
            const columns: Column[] = [
              {
                header: "Product Name",
                accessor: "name",
                render: (item) => <span>{String(item?.name ?? "")}</span>,
              },
              {
                header: "Id",
                accessor: "id",
                render: (item) => <span>{String(item?.id ?? "")}</span>,
              },
              {
                header: "Unit Price",
                accessor: "unitPrice",
                render: (item) => {
                  const n = Number(item?.unitPrice);
                  const safe = Number.isFinite(n) ? n : 0;
                  return <span>${safe.toFixed(2)}</span>;
                },
              },
              {
                header: "Stock",
                accessor: "stock",
                render: (item) => {
                  const n = Number(item?.stock);
                  const safe = Number.isFinite(n) ? n : 0;
                  return <span>{safe}</span>;
                },
              },
              {
                header: "Status",
                accessor: "status",
                render: (item) => <StatusText status={String(item?.status ?? "")} />,
              },
              {
                header: "Last Updated",
                accessor: "lastUpdated",
                render: (item) => {
                  const raw = item?.lastUpdated;
                  const d = raw ? new Date(String(raw)) : null;
                  if (!d || Number.isNaN(d.getTime())) return <span>—</span>;
                  return <span>{format(d, "MMM dd, yyyy | hh:mm a")}</span>;
                },
              },
              {
                header: "Action",
                accessor: "id",
                render: (item) => {
                  const id = String(item?.id ?? "");
                  const disabled = !id || deletingId === id;
                  return (
                    <div className="flex justify-start items-center gap-2">
                      <button
                        type="button"
                        className={`inline-flex items-center justify-center text-black/60 ${disabled ? "opacity-60 cursor-not-allowed" : ""
                          }`}
                        disabled={disabled}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!id) return;
                          setEditingProduct(item as AdminProductRow);
                          setModalOpen(true);
                        }}
                        aria-label="Edit"
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        className={`inline-flex items-center justify-center text-black/60 ${disabled ? "opacity-60 cursor-not-allowed" : ""
                          }`}
                        disabled={disabled}
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!id) return;
                          const result = await Swal.fire({
                            title: "Delete this product?",
                            text: "This will permanently delete the product.",
                            icon: "warning",
                            showCancelButton: true,
                            confirmButtonColor: "#3F78D8",
                            cancelButtonColor: "#d33",
                            confirmButtonText: "Delete",
                            cancelButtonText: "Cancel",
                          });
                          if (!result.isConfirmed) return;
                          try {
                            setDeletingId(id);
                            const res = await fetch(`/api/admin/products/${encodeURIComponent(id)}`, { method: "DELETE" });
                            const payload = await res.json().catch(() => null);
                            if (!res.ok) {
                              toast.error(
                                typeof (payload as any)?.error === "string" ? (payload as any).error : "Failed to delete"
                              );
                              return;
                            }
                            toast.success("Product deleted");
                            refetch();
                          } catch {
                            toast.error("Network error");
                          } finally {
                            setDeletingId(null);
                          }
                        }}
                        aria-label="Delete"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                },
              },
            ];
            return (
              <>
                <AddEditProductModal
                  open={modalOpen}
                  onOpenChange={(next) => {
                    setModalOpen(next);
                    if (!next) setEditingProduct(null);
                  }}
                  initialProduct={editingProduct}
                  onSaved={() => refetchRef.current?.()}
                />
                <DynamicTable data={data} columns={columns} itemsPerPage={7} isLoading={isLoading} />
              </>
            );
          }}
        </ServerPaginationProvider>
      </BoxProviderWithName>
    </BasicStructureWithName>
  );
}
