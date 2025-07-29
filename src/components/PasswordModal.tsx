'use client'

import { useState, useEffect } from 'react'

interface PasswordModalProps {
  isOpen: boolean
  onSuccess: () => void
}

export default function PasswordModal({ isOpen, onSuccess }: PasswordModalProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const CORRECT_PASSWORD = 'timetable'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // Simulate a small delay for better UX
    setTimeout(() => {
      if (password === CORRECT_PASSWORD) {
        // Store authentication in sessionStorage
        sessionStorage.setItem('printtrack_authenticated', 'true')
        onSuccess()
      } else {
        setError('Incorrect password. Please try again.')
        setPassword('')
      }
      setIsLoading(false)
    }, 500)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e as any)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 sm:p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-4">🔐</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            PrintTrack Access
          </h2>
          <p className="text-gray-600">
            Enter the password to access your dashboard
          </p>
        </div>

        {/* Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-3 text-lg border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="Enter password"
              autoFocus
              disabled={isLoading}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!password.trim() || isLoading}
            className="w-full btn btn-primary btn-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="loading-spinner w-5 h-5 mr-2"></div>
                Verifying...
              </div>
            ) : (
              'Access Dashboard'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Protected by PrintTrack Security
          </p>
        </div>
      </div>
    </div>
  )
} 