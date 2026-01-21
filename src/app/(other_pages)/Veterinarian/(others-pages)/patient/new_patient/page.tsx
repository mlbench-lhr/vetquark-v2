import AddPatientGuardian from '@/components/Veterinarian/new_patient/index'
import AddPatientMultiStep from '@/components/Veterinarian/new_patient/new_patient'
import React, { Suspense } from 'react'

function page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen p-4 space-y-4 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="h-5 w-40 rounded bg-gray-300" />
            <div className="h-12 w-12 rounded-full bg-gray-300" />
          </div>
          <div className="rounded-2xl bg-[#F5F6F6] p-4">
            <div className="h-5 w-48 rounded bg-gray-300" />
            <div className="mt-2 h-4 w-72 rounded bg-gray-300" />
          </div>
          <div className="rounded-2xl bg-[#F5F6F6] p-4 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-14 w-full rounded-2xl bg-gray-300" />
            ))}
          </div>
          <div className="space-y-3">
            <div className="h-14 w-full rounded-2xl bg-gray-300" />
            <div className="h-14 w-full rounded-2xl bg-gray-300" />
          </div>
        </div>
      }
    >
      <AddPatientMultiStep />
    </Suspense>
  )
}

export default page
