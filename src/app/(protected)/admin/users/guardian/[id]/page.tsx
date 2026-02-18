"use client";

import { BasicStructureWithName } from "@/components/BasicStructureWithName";
import { BoxProviderWithName } from "@/components/BoxProviderWithName";
import { Mail, MapPin, MessageSquare, Phone } from "lucide-react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type AdminUserDetail = {
  id: string;
  role: "Veterinarian" | "Guardian" | null;
  profileType: "Veterinarian" | "Guardian" | null;
  fullName: string;
  email: string;
  phone: string;
  taxId: string;
  dateOfBirth: string;
  address: string;
  country: string;
  city: string;
  state: string;
  postalCode: string;
  profileImageUrl: string;
  emailVerified: boolean | null;
  emailVerifiedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

function nonEmpty(s: unknown): s is string {
  return typeof s === "string" && s.trim().length > 0;
}

function buildAddress(u: AdminUserDetail) {
  const parts = [u.address, u.city, u.state, u.postalCode, u.country].filter(nonEmpty);
  return parts.join(", ");
}

function initials(name: string) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/g)
    .filter(Boolean)
    .slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join("");
}

export default function GuardianUserDetailPage() {
  const params = useParams()
  const userId = String(params?.id || "");
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/users/detail/${encodeURIComponent(userId)}`, { credentials: "include" });
        const json = await res.json().catch(() => null);
        if (!alive) return;
        if (res.ok && json?.user) setUser(json.user as AdminUserDetail);
        else setUser(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [userId]);

  const displayName = user?.fullName || "";
  const displayId = user?.taxId?.trim() ? user.taxId : user?.id || "";
  const addressLabel = useMemo(() => (user ? buildAddress(user) : ""), [user]);

  return (
    <BasicStructureWithName
      name="Guardian Details"
      subHeading="View guardian profile information."
      showBackOption
    >
      <div className="w-full">
        <BoxProviderWithName className="border-gray-200">
          <div className="w-full overflow-hidden rounded-2xl bg-white">
            <div className="relative h-[210px] w-full bg-gradient-to-br from-gray-100 to-gray-200">
              {user?.profileImageUrl ? (
                <Image
                  src={user.profileImageUrl}
                  alt={displayName || "Profile"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 900px"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-[88px] w-[88px] rounded-full bg-white/70 text-gray-700 flex items-center justify-center text-2xl font-semibold">
                    {initials(displayName)}
                  </div>
                </div>
              )}
            </div>

            <div className="px-4 py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="truncate text-[18px] font-semibold text-gray-900">{displayName || "—"}</div>
                  <div className="mt-1 text-[13px] text-gray-500">ID: {displayId || "—"}</div>
                </div>
                <div className="flex items-center gap-2">
                  {user?.phone?.trim() ? (
                    <>
                      <a
                        href={`tel:${user.phone}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#F5F6F6] text-[#3F78D8] hover:bg-gray-100"
                        aria-label="Call"
                      >
                        <Phone size={18} />
                      </a>
                      <a
                        href={`sms:${user.phone}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#F5F6F6] text-[#3F78D8] hover:bg-gray-100"
                        aria-label="Message"
                      >
                        <MessageSquare size={18} />
                      </a>
                    </>
                  ) : null}
                  {user?.email?.trim() ? (
                    <a
                      href={`mailto:${user.email}`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#F5F6F6] text-[#3F78D8] hover:bg-gray-100"
                      aria-label="Email"
                    >
                      <Mail size={18} />
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </BoxProviderWithName>
      </div>

      <BoxProviderWithName name="Info" className="border-gray-200">
        <div className="w-full space-y-3">
          <div className="w-full rounded-xl bg-[#F5F6F6] px-4 py-3 flex items-start gap-3">
            <Phone className="mt-0.5 text-gray-500" size={18} />
            <div className="min-w-0">
              <div className="text-xs text-gray-500">Mobile</div>
              <div className="text-sm font-medium text-gray-900">{user?.phone?.trim() || (loading ? "—" : "—")}</div>
            </div>
          </div>

          <div className="w-full rounded-xl bg-[#F5F6F6] px-4 py-3 flex items-start gap-3">
            <Mail className="mt-0.5 text-gray-500" size={18} />
            <div className="min-w-0">
              <div className="text-xs text-gray-500">Email</div>
              <div className="text-sm font-medium text-gray-900">{user?.email?.trim() || (loading ? "—" : "—")}</div>
            </div>
          </div>

          <div className="w-full rounded-xl bg-[#F5F6F6] px-4 py-3 flex items-start gap-3">
            <MapPin className="mt-0.5 text-gray-500" size={18} />
            <div className="min-w-0">
              <div className="text-xs text-gray-500">Address</div>
              <div className="text-sm font-medium text-gray-900 break-words">{addressLabel || (loading ? "—" : "—")}</div>
            </div>
          </div>
        </div>
      </BoxProviderWithName>

      <BoxProviderWithName name="Account" className="border-gray-200">
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-xl bg-[#F5F6F6] px-4 py-3">
            <div className="text-xs text-gray-500">Email Verified</div>
            <div className="text-sm font-medium text-gray-900">
              {user?.emailVerified === null ? "—" : user?.emailVerified ? "Yes" : "No"}
            </div>
          </div>
          <div className="rounded-xl bg-[#F5F6F6] px-4 py-3">
            <div className="text-xs text-gray-500">Date of Birth</div>
            <div className="text-sm font-medium text-gray-900">{user?.dateOfBirth?.trim() || "—"}</div>
          </div>
        </div>
      </BoxProviderWithName>
    </BasicStructureWithName>
  );
}

