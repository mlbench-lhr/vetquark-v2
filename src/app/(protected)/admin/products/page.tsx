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
import AddEditPanelModal from "@/components/AddEditPanelModal";
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

type AdminPanelRow = {
  id: string;
  code: string;
  title: string;
  active: boolean;
  sortOrder: number;
  suggestedPriceBRL: number;
  commissionPriceBRL: number | null;
  status: string;
  lastUpdated: string | null;
};
export default function Dashboard() {
  const [tab, setTab] = useState<"products" | "panels">("products");
  const [search, setSearch] = useState<string>("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProductRow | null>(null);
  const refetchRef = useRef<null | (() => void)>(null);
  const [panelDeletingId, setPanelDeletingId] = useState<string | null>(null);
  const [panelModalOpen, setPanelModalOpen] = useState(false);
  const [editingPanel, setEditingPanel] = useState<AdminPanelRow | null>(null);

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
      <div className="flex w-full flex-col gap-3">
        <div className="flex w-full flex-col items-start justify-start gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex rounded-full bg-gray-100 p-1">
            <button
              type="button"
              className={`rounded-full px-4 py-2 text-sm font-medium ${tab === "products" ? "bg-white shadow-sm" : "text-gray-600"}`}
              onClick={() => setTab("products")}
            >
              Products
            </button>
            <button
              type="button"
              className={`rounded-full px-4 py-2 text-sm font-medium ${tab === "panels" ? "bg-white shadow-sm" : "text-gray-600"}`}
              onClick={() => setTab("panels")}
            >
              Panels
            </button>
          </div>
        </div>

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
            if (tab === "products") {
              setEditingProduct(null);
              setModalOpen(true);
              return;
            }
            setEditingPanel(null);
            setPanelModalOpen(true);
          }}
          className="w-full md:w-fit"
        >
          <Plus />
          {tab === "products" ? "Add Product" : "Add Panel"}
        </Button>
      </div>
      </div>
      <BoxProviderWithName
      // noBorder={true}
      // className="p-0!"
      >
        {tab === "products" ? (
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
        ) : (
          <ServerPaginationProvider<AdminPanelRow>
            apiEndpoint="/api/admin/panels"
            queryParams={queryParams}
            LoadingComponent={BookingsLoadingSkeleton}
            NoDataComponent={() => <NoDataComponent text="No Panels Yet" />}
            itemsPerPage={7}
          >
            {(data, isLoading, refetch) => {
              refetchRef.current = refetch;
              const columns: Column[] = [
                { header: "Title", accessor: "title", render: (item) => <span>{String((item as any)?.title ?? "")}</span> },
                { header: "Code", accessor: "code", render: (item) => <span>{String((item as any)?.code ?? "")}</span> },
                {
                  header: "Suggested (BRL)",
                  accessor: "suggestedPriceBRL",
                  render: (item) => {
                    const n = Number((item as any)?.suggestedPriceBRL);
                    const safe = Number.isFinite(n) ? n : 0;
                    return <span>R$ {safe.toFixed(2)}</span>;
                  },
                },
                {
                  header: "Commission (BRL)",
                  accessor: "commissionPriceBRL",
                  render: (item) => {
                    const raw = (item as any)?.commissionPriceBRL;
                    const n = raw === null || raw === undefined ? null : Number(raw);
                    if (n === null || !Number.isFinite(n)) return <span>—</span>;
                    return <span>R$ {n.toFixed(2)}</span>;
                  },
                },
                {
                  header: "Status",
                  accessor: "status",
                  render: (item) => <StatusText status={String((item as any)?.status ?? "")} />,
                },
                {
                  header: "Last Updated",
                  accessor: "lastUpdated",
                  render: (item) => {
                    const raw = (item as any)?.lastUpdated;
                    const d = raw ? new Date(String(raw)) : null;
                    if (!d || Number.isNaN(d.getTime())) return <span>—</span>;
                    return <span>{format(d, "MMM dd, yyyy | hh:mm a")}</span>;
                  },
                },
                {
                  header: "Action",
                  accessor: "id",
                  render: (item) => {
                    const id = String((item as any)?.id ?? "");
                    const disabled = !id || panelDeletingId === id;
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
                            setEditingPanel(item as AdminPanelRow);
                            setPanelModalOpen(true);
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
                              title: "Delete this panel?",
                              text: "This will permanently delete the panel.",
                              icon: "warning",
                              showCancelButton: true,
                              confirmButtonColor: "#3F78D8",
                              cancelButtonColor: "#d33",
                              confirmButtonText: "Delete",
                              cancelButtonText: "Cancel",
                            });
                            if (!result.isConfirmed) return;
                            try {
                              setPanelDeletingId(id);
                              const res = await fetch(`/api/admin/panels/${encodeURIComponent(id)}`, { method: "DELETE" });
                              const payload = await res.json().catch(() => null);
                              if (!res.ok) {
                                toast.error(
                                  typeof (payload as any)?.error === "string" ? (payload as any).error : "Failed to delete"
                                );
                                return;
                              }
                              toast.success("Panel deleted");
                              refetch();
                            } catch {
                              toast.error("Network error");
                            } finally {
                              setPanelDeletingId(null);
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
                  <AddEditPanelModal
                    open={panelModalOpen}
                    onOpenChange={(next) => {
                      setPanelModalOpen(next);
                      if (!next) setEditingPanel(null);
                    }}
                    initialPanel={editingPanel}
                    onSaved={() => refetchRef.current?.()}
                  />
                  <DynamicTable data={data} columns={columns} itemsPerPage={7} isLoading={isLoading} />
                </>
              );
            }}
          </ServerPaginationProvider>
        )}
      </BoxProviderWithName>
    </BasicStructureWithName>
  );
}
