'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Staff {
  id: string
  name: string
  is_active: boolean
  created_at: string
}

export default function StaffManagement() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [newStaffName, setNewStaffName] = useState('')
  const [deletingStaffId, setDeletingStaffId] = useState<string | null>(null)

  useEffect(() => {
    fetchStaff()
  }, [])

  const fetchStaff = async () => {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (error) {
      console.error('Error fetching staff:', error)
      return
    }

    setStaff(data || [])
  }

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newStaffName.trim()) {
      alert('Please enter a staff name')
      return
    }

    const { error } = await supabase
      .from('staff')
      .insert([{ name: newStaffName.trim(), is_active: true }])

    if (error) {
      console.error('Error adding staff:', error)
      alert('Error adding staff member')
      return
    }

    setNewStaffName('')
    fetchStaff()
  }

  const handleDeleteStaff = (staffId: string) => {
    setDeletingStaffId(staffId)
  }

  const confirmDelete = async (staffId: string) => {
    const { error } = await supabase
      .from('staff')
      .update({ is_active: false })
      .eq('id', staffId)

    if (error) {
      console.error('Error deleting staff:', error)
      alert('Error deleting staff member')
      return
    }

    setDeletingStaffId(null)
    fetchStaff()
  }

  const cancelDelete = () => {
    setDeletingStaffId(null)
  }

  return (
    <>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Staff Management</h3>
      <p className="text-sm text-gray-600 mb-4">Add or remove staff members from the system.</p>
      
      {/* Add Staff Form */}
      <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h4 className="font-semibold text-gray-700 mb-3">Add New Staff Member</h4>
        <form id="addStaffForm" onSubmit={handleAddStaff} className="flex gap-3">
          <input
            type="text"
            id="newStaffName"
            placeholder="Enter staff name"
            value={newStaffName}
            onChange={(e) => setNewStaffName(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
          <button
            type="submit"
            className="navy-btn px-4 py-2 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Add Staff
          </button>
        </form>
      </div>
      
      {/* Staff List */}
      <div>
        <h4 className="font-semibold text-gray-700 mb-3">Current Staff Members</h4>
        <div id="staffList" className="space-y-2">
          {staff.length === 0 ? (
            <div className="text-center py-4 text-gray-500">No staff members found</div>
          ) : (
            staff.map(member => (
              <div
                key={member.id}
                id={`staff-item-${member.id}`}
                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
              >
                <span className="font-medium text-gray-700">{member.name}</span>
                <div className="flex items-center gap-2">
                  {deletingStaffId === member.id ? (
                    <div className="confirm-delete text-sm text-gray-600">
                      Are you sure?
                      <button
                        onClick={() => confirmDelete(member.id)}
                        className="ml-2 px-2 py-1 text-xs text-white bg-red-600 hover:bg-red-700 rounded transition-colors"
                      >
                        Yes
                      </button>
                      <button
                        onClick={cancelDelete}
                        className="ml-1 px-2 py-1 text-xs text-gray-600 bg-gray-200 hover:bg-gray-300 rounded transition-colors"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleDeleteStaff(member.id)}
                      className="delete-btn px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}
