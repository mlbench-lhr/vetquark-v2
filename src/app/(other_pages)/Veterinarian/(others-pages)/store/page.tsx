'use client'
import StoreModal from "@/components/Modals/StoreModal";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();
  return (
    <StoreModal
      isOpen={true}
      onClose={() => router.push('/Veterinarian/home')}
    />
  );
}
