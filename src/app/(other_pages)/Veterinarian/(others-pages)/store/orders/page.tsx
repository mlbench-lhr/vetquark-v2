'use client'

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

type OrderItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
};

type OrderAddress = {
  name: string;
  phone: string;
  location: string;
  addressLine: string;
  city: string;
  state: string;
  postalCode: string;
};

type StoreOrder = {
  id: string;
  status: string;
  total: number;
  createdAt: string | null;
  updatedAt: string | null;
  items: OrderItem[];
  address: OrderAddress | null;
};

const formatBrl = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const formatDateLabel = (iso: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

const getStatusUi = (statusRaw: string) => {
  const status = String(statusRaw || "").toLowerCase().trim();
  if (status === "delivered") return { label: "Delivered", className: "bg-green-50 text-green-700 border-green-200" };
  if (status === "shipped") return { label: "Shipped", className: "bg-blue-50 text-blue-700 border-blue-200" };
  if (status === "cancelled" || status === "canceled") return { label: "Cancelled", className: "bg-red-50 text-red-700 border-red-200" };
  if (status === "created") return { label: "Created", className: "bg-amber-50 text-amber-700 border-amber-200" };
  return { label: status ? status[0].toUpperCase() + status.slice(1) : "Unknown", className: "bg-gray-50 text-gray-700 border-gray-200" };
};

export default function Page() {
  const router = useRouter();
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/store/orders", { method: "GET" });
        const data = await res.json().catch(() => null);
        if (!mounted) return;
        if (!res.ok) {
          toast.error(data?.error || "Failed to load orders");
          setOrders([]);
          return;
        }
        const next = Array.isArray(data?.orders) ? (data.orders as StoreOrder[]) : [];
        setOrders(next);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const skeletonItems = useMemo(() => Array.from({ length: 4 }, (_, i) => i), []);

  return (
    <div className="min-h-screen px-3 py-5 relative bg-white">
      <div className="flex items-center justify-between">
        <button
          aria-label="Back"
          className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          onClick={() => router.back()}
        >
          <ChevronLeft className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="text-base font-medium text-gray-900">My Orders</h1>
        <button className="w-12 h-12 bg-gray-10 rounded-full flex items-center justify-center" />
      </div>

      <div className="mt-4 space-y-3 pb-10">
        {loading ? (
          skeletonItems.map((k) => (
            <div key={k} className="animate-pulse rounded-2xl bg-[#F5F6F6] px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="h-4 w-40 rounded bg-gray-200" />
                <div className="h-6 w-20 rounded-full bg-gray-200" />
              </div>
              <div className="mt-3 h-3 w-56 rounded bg-gray-200" />
              <div className="mt-2 h-3 w-44 rounded bg-gray-200" />
            </div>
          ))
        ) : orders.length === 0 ? (
          <div className="text-tertiary text-sm">No orders yet.</div>
        ) : (
          orders.map((order) => {
            const statusUi = getStatusUi(order.status);
            const qty = Array.isArray(order.items) ? order.items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0) : 0;
            const firstItems = Array.isArray(order.items) ? order.items.slice(0, 2) : [];
            const remaining = Array.isArray(order.items) ? Math.max(0, order.items.length - firstItems.length) : 0;
            const shortId = order.id ? order.id.slice(-8) : "";

            return (
              <div key={order.id} className="rounded-2xl bg-[#F5F6F6] px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-[15px] font-semibold text-gray-900">Order #{shortId || order.id}</div>
                    <div className="mt-1 text-[13px] text-gray-500">{formatDateLabel(order.createdAt)}</div>
                  </div>
                  <div className={["shrink-0 rounded-full border px-3 py-1 text-[12px] font-medium", statusUi.className].join(" ")}>
                    {statusUi.label}
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-[13px] text-gray-700">
                  <div className="truncate">{qty} items</div>
                  <div className="font-semibold">{formatBrl(Number(order.total) || 0)}</div>
                </div>

                {order.address?.location ? (
                  <div className="mt-2 truncate text-[13px] text-gray-500">Delivery: {order.address.location}</div>
                ) : null}

                {firstItems.length ? (
                  <div className="mt-3 space-y-1">
                    {firstItems.map((it, idx) => (
                      <div key={`${order.id}_${idx}`} className="flex items-center justify-between text-[13px] text-gray-600">
                        <div className="min-w-0 truncate">{it.name}</div>
                        <div className="shrink-0">{it.quantity}x</div>
                      </div>
                    ))}
                    {remaining > 0 ? <div className="text-[13px] text-gray-500">+{remaining} more</div> : null}
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

