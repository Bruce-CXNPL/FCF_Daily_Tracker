'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import StaffInput from '@/components/StaffInput'
import { useAuth } from '@/contexts/AuthContext'

export default function Home() {
  const { user, isAdmin, isLoading, signOut } = useAuth()
  const router = useRouter()

  const handleAdminClick = () => {
    router.push('/admin')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <>
      {/* User Info Bar */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {user && (
            <div className="text-sm text-gray-600">
              Welcome, <span className="font-medium">{user.name}</span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-3">
          {isAdmin && (
            <button
              onClick={handleAdminClick}
              className="navy-btn inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Admin Dashboard
            </button>
          )}
          <button
            onClick={signOut}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div id="staffInputPage" className="max-w-4xl mx-auto">
        <StaffInput />
      </div>
    </>
  )
}
