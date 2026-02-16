import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import React from "react";

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const c = await cookies();
  const token = c.get("admin_session")?.value || "";
  const secret = process.env.AUTH_SECRET;
  if (!token || !secret) redirect("/admin/login");

  try {
    const decoded = jwt.verify(token, secret) as any;
    const role = decoded && typeof decoded === "object" ? String(decoded.role || "") : "";
    if (role !== "Admin") redirect("/admin/login");
  } catch {
    redirect("/admin/login");
  }

  return <div className="min-h-[100dvh] bg-white">{children}</div>;
}
