import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Page() {
  const c = await cookies();
  const token = c.get("session_id")?.value || c.get("auth_token")?.value;
  if (!token) {
    redirect("/signin");
  }
  const authSecret = process.env.AUTH_SECRET;
  if (!authSecret) {
    redirect("/signin");
  }
  try {
    const decoded = jwt.verify(token, authSecret) as any;
    const role = decoded && typeof decoded === "object" ? String((decoded as any).role || "") : "";
    if (role === "Veterinarian") {
      redirect("/Veterinarian/home");
    }
    if (role === "Guardian") {
      redirect("/Guardian/home");
    }
    redirect("/signin");
  } catch {
    redirect("/signin");
  }
}
