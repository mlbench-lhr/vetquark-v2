'use client'

import React, { useState, useEffect } from 'react'
import { getErrorLog, clearErrorLog, type ErrorInfo } from '@/utils/errorHandler'

export default function ErrorLogViewer() {
  const [errors, setErrors] = useState<ErrorInfo[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Only show in development or when there are errors
    const checkErrors = () => {
      const log = getErrorLog()
      setErrors(log)
      setIsVisible(log.length > 0)
    }

    // Check every 2 seconds
    const interval = setInterval(checkErrors, 2000)
    checkErrors()

    return () => clearInterval(interval)
  }, [])

  const handleClear = () => {
    clearErrorLog()
    setErrors([])
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 w-12 h-12 bg-red-500 text-white rounded-full shadow-lg flex items-center justify-center font-bold hover:bg-red-600 transition-colors"
        title="View Errors"
      >
        {errors.length}
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">
                Error Log ({errors.length})
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleClear}
                  className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {errors.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No errors logged</p>
              ) : (
                <div className="space-y-3">
                  {errors.map((error, index) => (
                    <div
                      key={index}
                      className="bg-red-50 border border-red-200 rounded-lg p-3"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-xs text-red-600 font-medium">
                          {error.timestamp}
                        </span>
                        <span className="text-xs text-gray-500">
                          {error.url.slice(-20)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-900 font-medium mb-1">
                        {error.message}
                      </p>
                      {error.stack && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-900">
                            Stack trace
                          </summary>
                          <pre className="text-xs text-gray-600 mt-1 whitespace-pre-wrap break-words">
                            {error.stack}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <p className="text-xs text-gray-500">
                Errors are logged locally for debugging. Clear them to dismiss this panel.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
