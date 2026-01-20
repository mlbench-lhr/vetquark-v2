'use client'
import StoreModal from "@/components/Modals/StoreModal";

export default function Page() {
  return (
    <StoreModal
      isOpen={true}
      onUpdated={() => console.log('Store updated')}
    />
  );
}
