import AddPatientGuardian from '@/components/Veterinarian/new_patient/index'
import AddPatientMultiStep from '@/components/Veterinarian/new_patient/new_patient'
import React, { Suspense } from 'react'

function page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AddPatientMultiStep />
    </Suspense>
  )
}

export default page
