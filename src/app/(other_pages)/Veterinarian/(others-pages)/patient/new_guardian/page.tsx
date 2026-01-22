import GuardianRegistration from '@/components/Veterinarian/new_patient/add_guardian'
import { Suspense } from 'react'

function page() {
  return (
    <Suspense fallback={null}>
      <GuardianRegistration />
    </Suspense>
  )
}

export default page
