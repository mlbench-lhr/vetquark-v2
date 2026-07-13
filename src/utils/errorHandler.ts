'use client'

import { toast } from 'react-toastify'

export interface ErrorInfo {
  message: string
  stack?: string
  timestamp: string
  userAgent: string
  url: string
}

// Store errors in memory for debugging
const errorLog: ErrorInfo[] = []
const MAX_ERRORS = 50

function formatError(error: unknown): ErrorInfo {
  const timestamp = new Date().toISOString()
  
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
      timestamp,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
    }
  }
  
  return {
    message: String(error),
    timestamp,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    url: typeof window !== 'undefined' ? window.location.href : 'unknown',
  }
}

function logError(errorInfo: ErrorInfo) {
  errorLog.push(errorInfo)
  if (errorLog.length > MAX_ERRORS) {
    errorLog.shift()
  }
  
  // Also log to console for desktop debugging
  console.error('Error logged:', errorInfo)
}

export function getErrorLog(): ErrorInfo[] {
  return [...errorLog]
}

export function clearErrorLog() {
  errorLog.length = 0
}

export function showErrorToUser(error: unknown, context?: string) {
  const errorInfo = formatError(error)
  logError(errorInfo)
  
  // Show user-friendly error message
  const message = context 
    ? `${context}: ${errorInfo.message}`
    : errorInfo.message
  
  // Truncate very long error messages for display
  const displayMessage = message.length > 200 
    ? message.substring(0, 200) + '...' 
    : message
  
  toast.error(displayMessage, {
    autoClose: 8000,
    closeOnClick: true,
    draggable: true,
  })
  
  // On mobile, also show a more detailed error in a second toast
  if (typeof window !== 'undefined' && window.innerWidth < 768) {
    setTimeout(() => {
      toast.info(`Error ID: ${errorInfo.timestamp.slice(-8)}`, {
        autoClose: 5000,
        position: 'bottom-center',
      })
    }, 1000)
  }
}

export function setupGlobalErrorHandlers() {
  if (typeof window === 'undefined') return
  
  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    const errorInfo = formatError(event.error || event.message)
    logError(errorInfo)
    
    toast.error(`Error: ${errorInfo.message}`, {
      autoClose: 8000,
    })
  })
  
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const errorInfo = formatError(event.reason)
    logError(errorInfo)
    
    toast.error(`Promise Error: ${errorInfo.message}`, {
      autoClose: 8000,
    })
  })
  
  // Handle React-specific errors (if available)
  if (typeof window !== 'undefined' && (window as any).ErrorUtils) {
    (window as any).ErrorUtils.setGlobalHandler((error: Error, isFatal: boolean) => {
      const errorInfo = formatError(error)
      logError(errorInfo)
      
      toast.error(`React Error: ${errorInfo.message}`, {
        autoClose: 8000,
      })
    })
  }
}

// Development helper to show error log
export function showErrorLogInConsole() {
  console.table(errorLog)
  console.log('Full error log:', errorLog)
  return errorLog
}
