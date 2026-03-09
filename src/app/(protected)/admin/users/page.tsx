"use client";

import { BasicStructureWithName } from "@/components/BasicStructureWithName";
import { BoxProviderWithName } from "@/components/BoxProviderWithName";
import { NoDataComponent } from "@/components/NoDataComponent";
import { ServerPaginationProvider } from "@/components/PaginationProvider";
import { SearchComponent } from "@/components/SearchComponent";
import { Column, DynamicTable } from "@/components/Table/page";
import { Eye, LockKeyhole, Trash } from "lucide-react";
import { format } from "date-fns";
import type React from "react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import { EyeCloseIcon, EyeIcon } from "@/icons";

type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  crmvOrStateLabel: string;
  exams: number;
  joined: string | null;
};

export default function Dashboard() {
  const router = useRouter();
  const [search, setSearch] = useState<string>("");
  const [activeRole, setActiveRole] = useState<"Veterinarian" | "Guardian">("Veterinarian");
  const [actionUserId, setActionUserId] = useState<string | null>(null);

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwordUser, setPasswordUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

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
            {(data, isLoading, refetch) => {
              const columns: Column[] = [
                {
                  header: activeRole === "Veterinarian" ? "Veterinarian" : "Guardian",
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
                    const name = String(item?.name ?? "");
                    const email = String(item?.email ?? "");
                    const disabled = actionUserId === id || passwordSaving;
                    return (
                      <div className="flex justify-start items-center gap-2">
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-gray-700 hover:bg-gray-100"
                          disabled={disabled}
                          onClick={() => {
                            const segment = activeRole === "Veterinarian" ? "veterinarian" : "guardian";
                            router.push(`/admin/users/${segment}/${encodeURIComponent(id)}`);
                          }}
                        >
                          <Eye size={16} />
                        </button>

                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-gray-700 hover:bg-gray-100"
                          disabled={disabled}
                          onClick={() => {
                            setPasswordUser({ id, name, email });
                            setNewPassword("");
                            setConfirmPassword("");
                            setShowNewPassword(false);
                            setShowConfirmPassword(false);
                            setPasswordOpen(true);
                          }}
                        >
                          <LockKeyhole size={16} />
                        </button>

                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-md border border-red-200 bg-red-50 px-2.5 py-1.5 text-red-700 hover:bg-red-100"
                          disabled={disabled}
                          onClick={async () => {
                            const result = await Swal.fire({
                              title: "Delete user?",
                              text: "This will permanently delete this user and related records from the database.",
                              icon: "warning",
                              showCancelButton: true,
                              confirmButtonText: "Delete",
                              cancelButtonText: "Cancel",
                            });

                            if (!result.isConfirmed) return;

                            try {
                              setActionUserId(id);
                              const res = await fetch(`/api/admin/users/${encodeURIComponent(id)}`, {
                                method: "DELETE",
                                credentials: "include",
                              });
                              const json = await res.json().catch(() => ({}));
                              if (!res.ok) {
                                toast.error(typeof (json as any)?.error === "string" ? (json as any).error : "Failed to delete user");
                                return;
                              }
                              toast.success("User deleted successfully");
                              refetch();
                            } catch {
                              toast.error("Network error");
                            } finally {
                              setActionUserId(null);
                            }
                          }}
                        >
                          <Trash size={16} />
                        </button>
                      </div>
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

                  <Modal
                    isOpen={passwordOpen}
                    onClose={() => {
                      if (passwordSaving) return;
                      setPasswordOpen(false);
                      setPasswordUser(null);
                      setNewPassword("");
                      setConfirmPassword("");
                      setShowNewPassword(false);
                      setShowConfirmPassword(false);
                    }}
                    className="max-w-[520px] p-6 lg:p-10"
                  >
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!passwordUser) return;

                        const pw = newPassword.trim();
                        const cpw = confirmPassword.trim();
                        if (!pw || !cpw) {
                          toast.error("Please fill all fields");
                          return;
                        }
                        if (pw.length < 8) {
                          toast.error("New password must be at least 8 characters");
                          return;
                        }
                        if (pw !== cpw) {
                          toast.error("Passwords do not match");
                          return;
                        }

                        try {
                          setPasswordSaving(true);
                          const res = await fetch(`/api/admin/users/${encodeURIComponent(passwordUser.id)}`, {
                            method: "PATCH",
                            credentials: "include",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ newPassword: pw }),
                          });
                          const json = await res.json().catch(() => ({}));
                          if (!res.ok) {
                            toast.error(typeof (json as any)?.error === "string" ? (json as any).error : "Failed to change password");
                            return;
                          }
                          toast.success("Password updated");
                          setPasswordOpen(false);
                          setPasswordUser(null);
                          setNewPassword("");
                          setConfirmPassword("");
                          setShowNewPassword(false);
                          setShowConfirmPassword(false);
                          refetch();
                        } catch {
                          toast.error("Network error");
                        } finally {
                          setPasswordSaving(false);
                        }
                      }}
                      className="w-full"
                    >
                      <div className="text-center mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Change Password</h2>
                        <div className="text-sm text-gray-500">
                          {passwordUser ? `${passwordUser.name} • ${passwordUser.email}` : ""}
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <Label>New Password</Label>
                          <div className="relative">
                            <Input
                              name="newPassword"
                              type={showNewPassword ? "text" : "password"}
                              placeholder="Enter a new password"
                              value={newPassword}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
                              required
                              disabled={passwordSaving}
                              className="pr-12"
                            />
                            <span
                              onClick={() => setShowNewPassword((prev) => !prev)}
                              className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                            >
                              {showNewPassword ? (
                                <div className="opacity-50">
                                  <EyeIcon />
                                </div>
                              ) : (
                                <div className="opacity-50">
                                  <EyeCloseIcon />
                                </div>
                              )}
                            </span>
                          </div>
                        </div>

                        <div>
                          <Label>Confirm New Password</Label>
                          <div className="relative">
                            <Input
                              name="confirmPassword"
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="Confirm the new password"
                              value={confirmPassword}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                              required
                              disabled={passwordSaving}
                              className="pr-12"
                            />
                            <span
                              onClick={() => setShowConfirmPassword((prev) => !prev)}
                              className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                            >
                              {showConfirmPassword ? (
                                <div className="opacity-50">
                                  <EyeIcon />
                                </div>
                              ) : (
                                <div className="opacity-50">
                                  <EyeCloseIcon />
                                </div>
                              )}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-2">
                          <button
                            type="button"
                            disabled={passwordSaving}
                            onClick={() => {
                              if (passwordSaving) return;
                              setPasswordOpen(false);
                              setPasswordUser(null);
                              setNewPassword("");
                              setConfirmPassword("");
                              setShowNewPassword(false);
                              setShowConfirmPassword(false);
                            }}
                            className="px-4 py-2 rounded-full border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={passwordSaving}
                            className="px-5 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                          >
                            {passwordSaving ? "Updating..." : "Update Password"}
                          </button>
                        </div>
                      </div>
                    </form>
                  </Modal>
                </>
              );
            }}
          </ServerPaginationProvider>
        </BoxProviderWithName>
      </div>
    </BasicStructureWithName>
  );
}
