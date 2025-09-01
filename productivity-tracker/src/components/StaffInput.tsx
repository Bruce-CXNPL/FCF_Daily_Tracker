'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

interface Task {
  id: string
  name: string
  category: string
  expected_duration_minutes: number
  position?: number
  category_position?: number
  measurement_type?: 'tasks' | 'time'
  display_text?: string
}

interface Staff {
  id: string
  name: string
  is_active: boolean
}

interface DailyEntryItem {
  task_id: string
  count: number
}

export default function StaffInput() {
  const { user, isLoading } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [taskCounts, setTaskCounts] = useState<Record<string, number>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [userStaffId, setUserStaffId] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchUserStaffId()
    }
    fetchTasks()
  }, [user])

  useEffect(() => {
    if (userStaffId && selectedDate) {
      fetchExistingEntry()
    }
  }, [userStaffId, selectedDate])

  const fetchUserStaffId = async () => {
    if (!user) return

    // Check if user has a linked staff record
    if (user.staff_id) {
      setUserStaffId(user.staff_id)
    } else {
      // Try to find or create a staff record for this user
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('id')
        .eq('name', user.name)
        .single()

      if (staffData) {
        // Link the staff record to the user
        setUserStaffId(staffData.id)
        await supabase
          .from('users')
          .update({ staff_id: staffData.id })
          .eq('id', user.id)
      } else {
        // Create a new staff record for this user
        const { data: newStaff, error: createError } = await supabase
          .from('staff')
          .insert({
            name: user.name,
            is_active: true
          })
          .select()
          .single()

        if (newStaff) {
          setUserStaffId(newStaff.id)
          await supabase
            .from('users')
            .update({ staff_id: newStaff.id })
            .eq('id', user.id)
        }
      }
    }
  }

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('is_active', true)

    if (error) {
      console.error('Error fetching tasks:', error)
      return
    }

    // Sort tasks by position columns if they exist
    const sortedTasks = (data || []).sort((a, b) => {
      // First sort by category position
      const categoryPosA = a.category_position || 999
      const categoryPosB = b.category_position || 999
      if (categoryPosA !== categoryPosB) {
        return categoryPosA - categoryPosB
      }
      
      // Then sort by task position within category
      const taskPosA = a.position || 999
      const taskPosB = b.position || 999
      return taskPosA - taskPosB
    })

    setTasks(sortedTasks)
  }

  const fetchExistingEntry = async () => {
    if (!userStaffId) return

    const { data, error } = await supabase
      .from('daily_entries')
      .select(`
        id,
        daily_entry_items (
          task_id,
          count
        )
      `)
      .eq('staff_id', userStaffId)
      .eq('entry_date', selectedDate)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching existing entry:', error)
      return
    }

    if (data) {
      const counts: Record<string, number> = {}
      data.daily_entry_items.forEach((item: any) => {
        counts[item.task_id] = item.count
      })
      setTaskCounts(counts)
    } else {
      setTaskCounts({})
    }
  }

  const handleCountChange = (taskId: string, value: string) => {
    const count = parseInt(value) || 0
    setTaskCounts(prev => ({
      ...prev,
      [taskId]: Math.max(0, count)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!userStaffId) {
      alert('Unable to identify staff member. Please contact an administrator.')
      return
    }

    if (!user) {
      alert('You must be logged in to submit entries.')
      return
    }

    setIsSubmitting(true)

    try {
      // Calculate total time based on measurement type
      let totalMinutes = 0
      const items = Object.entries(taskCounts)
        .filter(([_, count]) => count > 0)
        .map(([taskId, count]) => {
          const task = tasks.find(t => t.id === taskId)
          let calculatedTime = 0
          
          if (task) {
            if (task.measurement_type === 'time') {
              // For time-based tasks, count is direct minutes
              calculatedTime = count
            } else {
              // For task-based measurement, multiply by expected duration
              calculatedTime = count * task.expected_duration_minutes
            }
            totalMinutes += calculatedTime
          }
          
          return {
            task_id: taskId,
            count,
            calculated_time_minutes: calculatedTime
          }
        })

      // First, check if entry exists
      const { data: existingEntry } = await supabase
        .from('daily_entries')
        .select('id')
        .eq('staff_id', userStaffId)
        .eq('entry_date', selectedDate)
        .single()

      let entryId: string

      if (existingEntry) {
        // Update existing entry
        entryId = existingEntry.id
        
        // Delete existing items
        await supabase
          .from('daily_entry_items')
          .delete()
          .eq('daily_entry_id', entryId)
      } else {
        // Create new entry
        const { data: newEntry, error: entryError } = await supabase
          .from('daily_entries')
          .insert({
            staff_id: userStaffId,
            entry_date: selectedDate,
            total_calculated_time_minutes: totalMinutes,
            productivity_ratio: (totalMinutes / 450), // 7.5 hours = 450 minutes
            user_id: user.id // Link to the user who created this entry
          })
          .select()
          .single()

        if (entryError) throw entryError
        entryId = newEntry.id
      }

      // Insert new items
      if (items.length > 0) {
        const itemsToInsert = items.map(item => ({
          daily_entry_id: entryId,
          ...item
        }))

        const { error: itemsError } = await supabase
          .from('daily_entry_items')
          .insert(itemsToInsert)

        if (itemsError) throw itemsError
      }

      // Show success message
      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
      }, 10000)
    } catch (error) {
      console.error('Error saving entry:', error)
      alert('Error saving entry. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const groupedTasks = tasks.reduce((acc, task) => {
    if (!acc[task.category]) {
      acc[task.category] = []
    }
    acc[task.category].push(task)
    return acc
  }, {} as Record<string, Task[]>)

  // Get categories sorted by position
  const sortedCategories = Object.keys(groupedTasks).sort((a, b) => {
    const taskA = tasks.find(t => t.category === a)
    const taskB = tasks.find(t => t.category === b)
    const posA = taskA?.category_position || 999
    const posB = taskB?.category_position || 999
    return posA - posB
  })

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Daily Task Entry</h2>
      </div>

      <form id="taskForm" onSubmit={handleSubmit} className="p-6">
        {/* User Info and Date Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="staff-selection-container">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Logged in as
            </label>
            <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
              <span className="text-gray-900 font-medium">{user?.name || 'Loading...'}</span>
            </div>
          </div>
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <div className="relative">
              <input
                type="date"
                id="staff-input-date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                style={{ 
                  cursor: 'pointer',
                  WebkitAppearance: 'none',
                  position: 'relative',
                  zIndex: 1
                }}
                required
              />
              <div 
                className="absolute inset-0 cursor-pointer rounded-md"
                style={{ zIndex: 2 }}
                onClick={() => {
                  const input = document.getElementById('staff-input-date') as HTMLInputElement
                  if (input) {
                    input.focus()
                    if ('showPicker' in input && typeof (input as any).showPicker === 'function') {
                      try {
                        (input as any).showPicker()
                      } catch {
                        input.click()
                      }
                    } else {
                      input.click()
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Task Categories */}
        <div id="taskCategories" className="space-y-8">
          {sortedCategories.map((category) => {
            const categoryTasks = groupedTasks[category]
            return (
              <div key={category} className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 bg-gray-50 px-3 py-2 rounded">
                  {category}
                </h3>
                <div className="space-y-2">
                  {categoryTasks.map(task => (
                    <div key={task.id} className="flex items-center justify-between py-2 px-3 bg-white border border-gray-100 rounded">
                      <label htmlFor={`task-${task.id}`} className="text-sm font-medium text-gray-700 flex-1">
                        {task.name}
                      </label>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-gray-500 w-16 text-center">
                          {task.display_text || (task.measurement_type === 'time' ? 'Time (m)' : 'Tasks')}
                        </span>
                        <input
                          type="number"
                          id={`task-${task.id}`}
                          min="0"
                          value={taskCounts[task.id] || ''}
                          onChange={(e) => handleCountChange(task.id, e.target.value)}
                          className="task-input w-16 px-2 py-1 text-center border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder=""
                          data-task-id={task.id}
                          data-duration={task.expected_duration_minutes}
                          data-measurement-type={task.measurement_type || 'tasks'}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Submit Button */}
        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            id="submitBtn"
            disabled={isSubmitting}
            className={`navy-btn px-6 py-2 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 ${
              showSuccess ? 'opacity-80' : ''
            }`}
          >
            {showSuccess ? 'Saved!' : isSubmitting ? 'Saving...' : 'Save Entry'}
          </button>
        </div>
      </form>
    </div>
  )
}
