'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface User {
  id: string
  email: string
  name: string
  access_level: 'ops' | 'admin'
  is_verified: boolean
  created_at: string
  last_login: string | null
  staff_id: string | null
  is_active: boolean
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setIsLoading(true)
    
    // First try to fetch with is_active filter (for after migration)
    let { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    // If error (likely because is_active column doesn't exist), fetch all users
    if (error && error.message?.includes('is_active')) {
      console.log('is_active column not found, fetching all users')
      const fallbackResult = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
      
      data = fallbackResult.data
      error = fallbackResult.error
    }

    if (error) {
      console.error('Error fetching users:', error)
      setError('Failed to load users')
    } else {
      // Filter out inactive users on client side if is_active column exists
      const filteredUsers = (data || []).filter(user => user.is_active !== false)
      setUsers(filteredUsers)
    }
    setIsLoading(false)
  }

  const handleDelete = async (userId: string) => {
    setError('')
    setSuccess('')

    try {
      console.log('Attempting to soft delete user with ID:', userId)
      
      // First try soft delete (set is_active to false)
      let { error: dbError, data } = await supabase
        .from('users')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()

      // If error because is_active column doesn't exist, show warning
      if (dbError && dbError.message?.includes('is_active')) {
        setError('Cannot delete user: Database migration required. Please run the database migration first to enable soft delete functionality.')
        return
      }

      console.log('Soft delete result:', { error: dbError, data })

      if (dbError) {
        console.error('Error deactivating user:', dbError)
        setError(`Failed to delete user: ${dbError.message || 'Unknown error'}`)
      } else {
        setSuccess('User deleted successfully. All historical data has been preserved.')
        fetchUsers() // This will refresh the list and hide the deactivated user
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (error) {
      console.error('Error deactivating user:', error)
      setError(`Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-AU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">User Management</h3>
      <p className="text-sm text-gray-600 mb-6">
        Manage user accounts, access levels, and authentication settings.
      </p>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Access Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.access_level === 'admin' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.access_level === 'admin' ? 'Admin' : 'Ops'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.is_verified 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {user.is_verified ? 'Verified' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(user.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(user.last_login)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {users.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No users found
            </div>
          )}
        </div>
      )}

    </>
  )
}
