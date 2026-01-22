import React, { Suspense } from 'react'
import NewReadingWizard from '@/components/Veterinarian/new_reading/NewReadingWizard'

function page() {
  return (
    <Suspense fallback={null}>
      <NewReadingWizard />
    </Suspense>
  )
}

export default page
