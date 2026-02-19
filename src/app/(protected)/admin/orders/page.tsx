"use client";

import { BasicStructureWithName } from "@/components/BasicStructureWithName";
import { BoxProviderWithName } from "@/components/BoxProviderWithName";
import { NoDataComponent } from "@/components/NoDataComponent";
import { ServerPaginationProvider } from "@/components/PaginationProvider";
import { SearchComponent } from "@/components/SearchComponent";
import { Column, DynamicTable } from "@/components/Table/page";
import { CheckCircle, Package, X } from "lucide-react";
import { format } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { StatusBadge } from "@/components/StatusBadge";

type AdminOrderRow = {
  id: string;
  orderId: string;
  veterinarian: string;
  products: string;
  amount: number;
  payment: string;
  status: string;
  date: string | null;
};

type OrderDetail = {
  id: string;
  status: string;
  total: number;
  provider: string;
  providerTransactionId: string;
  createdAt: string | null;
  updatedAt: string | null;
  items: Array<{ productId: string; name: string; price: number; quantity: number }>;
  address: null | {
    name: string;
    phone: string;
    location: string;
    addressLine: string;
    city: string;
    state: string;
    postalCode: string;
  };
  veterinarian: { id: string; fullName: string; tradeName: string };
};

function formatUsd(amount: number) {
  const safe = Number.isFinite(amount) ? amount : 0;
  return `$${safe.toFixed(2)}`;
}

function titleCase(input: string) {
  const s = String(input || "").trim().toLowerCase();
  if (!s) return "—";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function buildAddressLabel(address: OrderDetail["address"]) {
  if (!address) return "—";
  if (address.location?.trim()) return address.location.trim();
  const parts = [address.addressLine, address.city, address.state, address.postalCode].filter((x) => typeof x === "string" && x.trim());
  return parts.length ? parts.join(", ") : "—";
}

function orderCode(order: Pick<OrderDetail, "id" | "createdAt">) {
  const year = order.createdAt ? new Date(order.createdAt).getFullYear() : new Date().getFullYear();
  const tail = String(order.id || "").slice(-3);
  const n = Number.isFinite(parseInt(tail, 16)) ? parseInt(tail, 16) % 1000 : 0;
  return `${year}-${String(n).padStart(3, "0")}`;
}

export default function Dashboard() {
  const [search, setSearch] = useState<string>("");
  const queryParams = useMemo(() => ({ search }), [search]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "products">("overview");
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string>("");

  const statusOptions = useMemo(
    () => [
      { value: "created", label: "Created" },
      { value: "paid", label: "Paid" },
      { value: "delivered", label: "Delivered" },
      { value: "cancelled", label: "Cancelled" },
    ],
    []
  );

  const LoadingSkeleton = () => (
    <div className="w-full space-y-2 animate-pulse">
      {[...Array(7)].map((_, i) => (
        <div key={i} className="h-10 md:h-16 bg-gray-200 rounded-lg" />
      ))}
    </div>
  );

  const NoOrdersFound = () => <NoDataComponent text="No Orders Yet" />;

  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  useEffect(() => {
    if (!drawerOpen || !selectedOrderId) return;
    let alive = true;
    (async () => {
      try {
        setDetailLoading(true);
        const res = await fetch(`/api/admin/orders/${encodeURIComponent(selectedOrderId)}`, { credentials: "include" });
        const json = await res.json().catch(() => null);
        if (!alive) return;
        if (!res.ok) {
          toast.error(json?.error || "Failed to load order details");
          setOrderDetail(null);
          return;
        }
        setOrderDetail((json?.order as OrderDetail) || null);
      } finally {
        if (alive) setDetailLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [drawerOpen, selectedOrderId]);

  return (
    <BasicStructureWithName
      name="Orders & Deliveries"
      subHeading="Track and manage product orders, shipments, and logistics."
      showBackOption={false}

    >
      <div className="w-full flex flex-col justify-start items-start gap-6">
        <SearchComponent searchQuery={search} onChangeFunc={setSearch} />

        <BoxProviderWithName >
          <ServerPaginationProvider<AdminOrderRow>
            apiEndpoint="/api/admin/orders"
            queryParams={queryParams}
            LoadingComponent={LoadingSkeleton}
            NoDataComponent={NoOrdersFound}
            itemsPerPage={7}
          >
            {(data, isLoading, refetch) => {
              const columns: Column[] = [
                {
                  header: "Order ID",
                  accessor: "orderId",
                  render: (item) => <span>{String(item?.orderId ?? "")}</span>,
                },
                {
                  header: "Veterinarian",
                  accessor: "veterinarian",
                  render: (item) => <span>{String(item?.veterinarian ?? "—")}</span>,
                },
                {
                  header: "Products",
                  accessor: "products",
                  render: (item) => <span>{String(item?.products ?? "—")}</span>,
                },
                {
                  header: "Amount",
                  accessor: "amount",
                  render: (item) => {
                    const n = Number(item?.amount);
                    const safe = Number.isFinite(n) ? n : 0;
                    return <span>${safe.toFixed(2)}</span>;
                  },
                },
                {
                  header: "Payment",
                  accessor: "payment",
                  render: (item) => {
                    const status = String(item?.status ?? "").trim().toLowerCase();
                    const paid = status === "paid" || status === "delivered" || (typeof item?.payment === "string" && item.payment.trim() && item.payment !== "—");
                    return (
                      <div className={["flex justify-start items-center capitalize gap-2", paid ? "text-[#00A63E]" : "text-gray-500"].join(" ")}>
                        {paid ? <CheckCircle size={14} /> : null}
                        {paid ? "Paid" : "Pending"}
                      </div>
                    );
                  },
                },
                {
                  header: "Status",
                  accessor: "status",
                  render: (item) => {
                    const id = String(item?.id ?? "");
                    const current = String(item?.status ?? "").trim().toLowerCase() || "created";
                    const isUpdating = statusUpdatingId === id;
                    const selectValue = statusOptions.some((o) => o.value === current) ? current : "created";

                    return (
                      <div className="flex items-center gap-2">
                        <StatusBadge status={current} />
                        <select
                          className="h-8 rounded-xl border border-gray-200 bg-white px-2 text-[12px] text-gray-700"
                          value={selectValue}
                          disabled={isUpdating}
                          onChange={async (e) => {
                            const next = String(e.target.value || "").trim().toLowerCase();
                            if (!id || next === current) return;
                            try {
                              setStatusUpdatingId(id);
                              const res = await fetch(`/api/admin/orders/${encodeURIComponent(id)}`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                credentials: "include",
                                body: JSON.stringify({ status: next }),
                              });
                              const json = await res.json().catch(() => null);
                              if (!res.ok) {
                                toast.error(json?.error || "Failed to update status");
                                return;
                              }
                              toast.success("Order status updated");
                              if (selectedOrderId === id && orderDetail) {
                                setOrderDetail({ ...orderDetail, status: next });
                              }
                              refetch();
                            } finally {
                              setStatusUpdatingId("");
                            }
                          }}
                        >
                          {statusOptions.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  },
                },
                {
                  header: "Date",
                  accessor: "date",
                  render: (item) => {
                    const raw = item?.date;
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
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-md text-primary"
                        onClick={() => {
                          setSelectedOrderId(id);
                          setActiveTab("overview");
                          setDrawerOpen(true);
                        }}
                      >
                        View Details
                      </button>
                    );
                  },
                },
              ];

              return (
                <>
                  <DynamicTable
                    data={data}
                    columns={columns}
                    itemsPerPage={7}
                    isLoading={isLoading}
                  />

                  {drawerOpen ? (
                    <div className="fixed inset-0 z-50">
                      <div
                        className="absolute inset-0 bg-black/30"
                        onClick={() => setDrawerOpen(false)}
                      />
                      <div className="absolute inset-y-0 right-0 w-full max-w-[520px] bg-white shadow-xl">
                        <div className="h-full flex flex-col">
                          <div className="px-5 pt-5">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-3 min-w-0">
                                <div className="h-10 w-10 rounded-full bg-[#3F78D8] flex items-center justify-center shrink-0">
                                  <Package className="text-white" size={18} />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <div className="text-[16px] font-semibold text-gray-900 truncate">
                                      {orderDetail ? `Order #${orderCode(orderDetail)}` : "Order"}
                                    </div>
                                    {orderDetail ? (
                                      <div className="rounded-full bg-[#E7FAE3] px-2.5 py-1 text-[12px] font-medium text-[#4A9E35]">
                                        {titleCase(orderDetail.status)}
                                      </div>
                                    ) : null}
                                  </div>
                                  {orderDetail ? (
                                    <div className="mt-1 text-[13px] text-gray-500 truncate">
                                      {orderDetail.veterinarian.fullName || "—"}
                                      {orderDetail.veterinarian.tradeName?.trim() ? ` • ${orderDetail.veterinarian.tradeName.trim()}` : ""}
                                    </div>
                                  ) : (
                                    <div className="mt-1 text-[13px] text-gray-500 truncate">
                                      {detailLoading ? "Loading..." : "—"}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <button
                                type="button"
                                className="h-8 w-8 rounded-md hover:bg-gray-100 flex items-center justify-center"
                                onClick={() => setDrawerOpen(false)}
                                aria-label="Close"
                              >
                                <X size={18} />
                              </button>
                            </div>

                            <div className="mt-4 flex items-center gap-6 border-b border-gray-200">
                              <button
                                type="button"
                                className={[
                                  "py-3 text-sm font-medium",
                                  activeTab === "overview" ? "text-primary border-b-2 border-primary" : "text-gray-500",
                                ].join(" ")}
                                onClick={() => setActiveTab("overview")}
                              >
                                Overview
                              </button>
                              <button
                                type="button"
                                className={[
                                  "py-3 text-sm font-medium",
                                  activeTab === "products" ? "text-primary border-b-2 border-primary" : "text-gray-500",
                                ].join(" ")}
                                onClick={() => setActiveTab("products")}
                              >
                                Products
                              </button>
                              {/* <button
                                type="button"
                                className="py-3 text-sm font-medium text-gray-300 cursor-not-allowed"
                                disabled
                              >
                                Tracking
                              </button> */}
                            </div>
                          </div>

                          <div className="flex-1 overflow-y-auto px-5 py-5">
                            {detailLoading ? (
                              <div className="space-y-3">
                                <div className="h-28 rounded-2xl bg-gray-100 animate-pulse" />
                                <div className="h-36 rounded-2xl bg-gray-100 animate-pulse" />
                              </div>
                            ) : !orderDetail ? (
                              <div className="text-sm text-gray-500">Order details not available.</div>
                            ) : activeTab === "overview" ? (
                              <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
                                <div className="px-4 py-3 text-[12px] font-semibold text-gray-600">ORDER DETAILS</div>
                                <div className="border-t border-gray-100">
                                  <div className="px-4 py-3 flex items-center justify-between gap-4">
                                    <div className="text-[13px] text-gray-500">Order Date</div>
                                    <div className="text-[13px] font-medium text-gray-900">
                                      {orderDetail.createdAt ? format(new Date(orderDetail.createdAt), "MMM dd, yyyy") : "—"}
                                    </div>
                                  </div>
                                  <div className="px-4 py-3 flex items-center justify-between gap-4 border-t border-gray-100">
                                    <div className="text-[13px] text-gray-500">Payment Status</div>
                                    <div className="flex items-center gap-2">
                                      <StatusBadge status="paid" />
                                    </div>
                                  </div>
                                  <div className="px-4 py-3 flex items-center justify-between gap-4 border-t border-gray-100">
                                    <div className="text-[13px] text-gray-500">Total Amount</div>
                                    <div className="text-[13px] font-semibold text-gray-900">{formatUsd(orderDetail.total)}</div>
                                  </div>
                                  <div className="px-4 py-3 flex items-start justify-between gap-4 border-t border-gray-100">
                                    <div className="text-[13px] text-gray-500">Clinic Address</div>
                                    <div className="text-right text-[13px] font-medium text-gray-900 max-w-[260px]">
                                      {buildAddressLabel(orderDetail.address)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
                                <div className="px-4 py-3 text-[12px] font-semibold text-gray-600">ITEMS ORDERED</div>
                                <div className="border-t border-gray-100 overflow-auto">
                                  <div className="px-4 py-3 grid grid-cols-[90px_50px_90px_90px] gap-3 justify-between text-[12px] text-gray-500">
                                    <div className="">Product</div>
                                    <div className="text-right">Qty</div>
                                    <div className="text-right">Price</div>
                                    <div className="text-right pe-4">Total</div>
                                  </div>
                                  <div className="border-t border-gray-100">
                                    {orderDetail.items.length ? (
                                      orderDetail.items.map((it, idx) => {
                                        const lineTotal = (Number(it.price) || 0) * (Number(it.quantity) || 0);
                                        return (
                                          <div
                                            key={`${orderDetail.id}_${idx}`}
                                            className="px-4 py-3 grid grid-cols-[90px_50px_90px_90px] gap-3 justify-between text-[13px] text-gray-900"
                                          >
                                            <div className=" truncate font-medium">{it.name}</div>
                                            <div className="text-right text-gray-700">{it.quantity}</div>
                                            <div className="text-right text-gray-700">{formatUsd(Number(it.price) || 0)}</div>
                                            <div className="text-right font-semibold pe-4">{formatUsd(lineTotal)}</div>
                                          </div>
                                        );
                                      })
                                    ) : (
                                      <div className="px-4 py-6 text-sm text-gray-500">No items.</div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </>
              );
            }}
          </ServerPaginationProvider>
        </BoxProviderWithName>
      </div>
    </BasicStructureWithName>
  );
}
