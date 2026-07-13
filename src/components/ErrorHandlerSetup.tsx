'use client'

import { useEffect } from 'react'
import { setupGlobalErrorHandlers } from '@/utils/errorHandler'

export default function ErrorHandlerSetup() {
  useEffect(() => {
    setupGlobalErrorHandlers()
  }, [])

  return null
}
