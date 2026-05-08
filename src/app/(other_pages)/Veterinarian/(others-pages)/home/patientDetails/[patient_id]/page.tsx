import PatientProfilePage from '@/components/Veterinarian/home/details/patient_details'

interface PageProps {
  params: Promise<{ patient_id: string }>;
}

export default async function Page({ params }: PageProps) {
  await params;
  return (
    <>
      <PatientProfilePage />
    </>
  )
}
