'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import StaffDailyOutput from '@/components/admin/StaffDailyOutput'
import TaskCalibration from '@/components/admin/TaskCalibration'
import UserManagement from '@/components/admin/UserManagement'

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('team-output')
  const { user, isAdmin, isLoading } = useAuth()

  // The middleware will handle redirecting non-admin users
  // This is just for UI display purposes
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You need admin privileges to access this page.</p>
          <Link href="/" className="mt-4 inline-block text-blue-600 hover:text-blue-500">
            Return to Home
          </Link>
        </div>
      </div>
    )
  }

  const switchTab = (tabId: string) => {
    setActiveTab(tabId)
  }

  return (
    <div id="adminPage">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Admin Dashboard</h2>
            <Link
              href="/"
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              ← Back to Entry
            </Link>
          </div>
          
          {/* Tab Navigation */}
          <div className="mt-4">
            <nav className="flex space-x-8">
              <button
                className={`tab-btn whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'team-output'
                    ? 'active border-blue-900 text-black'
                    : 'border-transparent text-black hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => switchTab('team-output')}
              >
                Team Output
              </button>
              <button
                className={`tab-btn whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'task-calibration'
                    ? 'active border-blue-900 text-black'
                    : 'border-transparent text-black hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => switchTab('task-calibration')}
              >
                Task Calibration
              </button>
              <button
                className={`tab-btn whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'user-management'
                    ? 'active border-blue-900 text-black'
                    : 'border-transparent text-black hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => switchTab('user-management')}
              >
                User Management
              </button>
            </nav>
          </div>
        </div>

        <div className="p-6">
          {/* Team Output Tab */}
          <div id="team-output" className={`tab-content ${activeTab !== 'team-output' ? 'hidden' : ''}`}>
            <StaffDailyOutput />
          </div>

          {/* Task Calibration Tab */}
          <div id="task-calibration" className={`tab-content ${activeTab !== 'task-calibration' ? 'hidden' : ''}`}>
            <TaskCalibration />
          </div>

          {/* User Management Tab */}
          <div id="user-management" className={`tab-content ${activeTab !== 'user-management' ? 'hidden' : ''}`}>
            <UserManagement />
          </div>
        </div>
      </div>
    </div>
  )
}
