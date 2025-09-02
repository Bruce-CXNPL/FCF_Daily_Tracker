'use client'

import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase'
import * as ExcelJS from 'exceljs'

interface TaskDetail {
  task_name: string
  category: string
  count: number
  duration: number
  calculated_time_minutes: number
  measurement_type: 'tasks' | 'time'
  position?: number
  category_position?: number
}

interface UserData {
  user_id: string
  user_name: string
  totalMinutes: number
  categories: Record<string, {
    tasks: TaskDetail[]
    totalCount: number
    category_position?: number
  }>
  entries: TaskDetail[]
}

interface User {
  id: string
  name: string
  email: string
  access_level: 'ops' | 'admin'
}

export default function StaffDailyOutput() {
  const [userData, setUserData] = useState<Record<string, UserData>>({})
  const [users, setUsers] = useState<User[]>([])
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [selectedStartDate, setSelectedStartDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [selectedEndDate, setSelectedEndDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [selectedUserId, setSelectedUserId] = useState('')
  const [isDateRange, setIsDateRange] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    fetchOutputs()
  }, [selectedDate, selectedStartDate, selectedEndDate, selectedUserId, isDateRange])

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, access_level')
      .order('name')

    if (error) {
      console.error('Error fetching users:', error)
      return
    }

    setUsers(data || [])
  }

  const fetchOutputs = async () => {
    setIsLoading(true)

    let query = supabase
      .from('daily_entries')
      .select(`
        id,
        user_id,
        entry_date,
        total_calculated_time_minutes,
        user:users!inner (id, name),
        daily_entry_items (
          count,
          calculated_time_minutes,
          task:tasks (
            id,
            name,
            category,
            expected_duration_minutes,
            measurement_type,
            position,
            category_position
          )
        )
      `)

    // Apply date filtering based on mode
    if (isDateRange) {
      query = query.gte('entry_date', selectedStartDate).lte('entry_date', selectedEndDate)
    } else {
      query = query.eq('entry_date', selectedDate)
    }

    if (selectedUserId) {
      query = query.eq('user_id', selectedUserId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching outputs:', error)
      setIsLoading(false)
      return
    }

    // Process data into the format needed for display
    const processedData: Record<string, UserData> = {}
    
    data?.forEach((entry: any) => {
      const userId = entry.user_id
      const userName = entry.user.name
      
      if (!processedData[userName]) {
        processedData[userName] = {
          user_id: userId,
          user_name: userName,
          totalMinutes: 0,
          categories: {},
          entries: []
        }
      }
      
      entry.daily_entry_items.forEach((item: any) => {
        if (item.count > 0 && item.task) {
          const task = item.task
          const category = task.category
          
          processedData[userName].totalMinutes += item.calculated_time_minutes
          
          if (!processedData[userName].categories[category]) {
            processedData[userName].categories[category] = {
              tasks: [],
              totalCount: 0,
              category_position: task.category_position || 999
            }
          }
          
          // Check if task already exists in this category
          const existingTaskIndex = processedData[userName].categories[category].tasks.findIndex(
            t => t.task_name === task.name
          )
          
          if (existingTaskIndex >= 0) {
            // Task exists, add to existing count
            processedData[userName].categories[category].tasks[existingTaskIndex].count += item.count
            processedData[userName].categories[category].tasks[existingTaskIndex].calculated_time_minutes += item.calculated_time_minutes
          } else {
            // New task, add it
            processedData[userName].categories[category].tasks.push({
              task_name: task.name,
              category: category,
              count: item.count,
              duration: task.expected_duration_minutes,
              calculated_time_minutes: item.calculated_time_minutes,
              measurement_type: task.measurement_type || 'tasks',
              position: task.position || 999,
              category_position: task.category_position || 999
            })
          }
          
          processedData[userName].categories[category].totalCount += item.count
          
          // Check if task already exists in entries
          const existingEntryIndex = processedData[userName].entries.findIndex(
            e => e.task_name === task.name && e.category === category
          )
          
          if (existingEntryIndex >= 0) {
            // Task exists, add to existing count
            processedData[userName].entries[existingEntryIndex].count += item.count
            processedData[userName].entries[existingEntryIndex].calculated_time_minutes += item.calculated_time_minutes
          } else {
            // New task, add it
            processedData[userName].entries.push({
              task_name: task.name,
              category: category,
              count: item.count,
              duration: task.expected_duration_minutes,
              calculated_time_minutes: item.calculated_time_minutes,
              measurement_type: task.measurement_type || 'tasks'
            })
          }
        }
      })
    })

    setUserData(processedData)
    setIsLoading(false)
  }

  const formatTimeHMM = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}:${mins.toString().padStart(2, '0')}`
  }

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook()
    
    // Format date for filename
    let formattedDate
    if (isDateRange) {
      const [startYear, startMonth, startDay] = selectedStartDate.split('-')
      const [endYear, endMonth, endDay] = selectedEndDate.split('-')
      const formattedStartDate = `${startDay}-${startMonth}-${startYear}`
      const formattedEndDate = `${endDay}-${endMonth}-${endYear}`
      formattedDate = `${formattedStartDate}_to_${formattedEndDate}`
    } else {
      const [year, month, day] = selectedDate.split('-')
      formattedDate = `${day}-${month}-${year}`
    }

    // Fetch raw data for Excel export (not consolidated like display data)
    let query = supabase
      .from('daily_entries')
      .select(`
        id,
        user_id,
        entry_date,
        total_calculated_time_minutes,
        user:users!inner (id, name),
        daily_entry_items (
          count,
          calculated_time_minutes,
          task:tasks (
            id,
            name,
            category,
            expected_duration_minutes,
            measurement_type,
            position,
            category_position
          )
        )
      `)
      .order('entry_date')

    // Apply date filtering
    if (isDateRange) {
      query = query.gte('entry_date', selectedStartDate).lte('entry_date', selectedEndDate)
    } else {
      query = query.eq('entry_date', selectedDate)
    }

    if (selectedUserId) {
      query = query.eq('user_id', selectedUserId)
    }

    const { data: rawData, error } = await query

    if (error) {
      console.error('Error fetching data for export:', error)
      return
    }

    // Helper function to format date as DD-MM-YYYY
    const formatDateDDMMYYYY = (dateStr: string) => {
      const [year, month, day] = dateStr.split('-')
      return `${day}-${month}-${year}`
    }
    
    // Sheet 1: Individual Output
    const individualSheet = workbook.addWorksheet(`individual-output-${formattedDate}`)
    
    // Individual sheet headers
    individualSheet.addRow([
      'Date', 'Staff Name', 'Category', 'Task', 'Unit Type', 'Count', 
      'Task Time Total (minutes)', 'Daily Time Sum (minutes)', 'Workload Target Achieved (%)'
    ])
    
    // Process individual sheet data - show each date separately
    rawData?.forEach((entry: any) => {
      const userName = entry.user.name
      const entryDate = formatDateDDMMYYYY(entry.entry_date)
      const dailyTotalMinutes = entry.total_calculated_time_minutes
      const dailyProductivity = Math.round((dailyTotalMinutes / 450) * 100) // 450 minutes = 7.5 hours
      const dailyTotalTimeFormatted = formatTimeHMM(dailyTotalMinutes)
      
      // Get tasks with counts > 0, sorted by category and task position
      const tasksWithCounts = entry.daily_entry_items
        .filter((item: any) => item.count > 0 && item.task)
        .map((item: any) => ({
          ...item,
          task: item.task
        }))
        .sort((a: any, b: any) => {
          const categoryCompare = (a.task.category_position || 999) - (b.task.category_position || 999)
          if (categoryCompare !== 0) return categoryCompare
          return (a.task.position || 999) - (b.task.position || 999)
        })

      tasksWithCounts.forEach((item: any) => {
        const task = item.task
        const unitType = task.measurement_type === 'time' ? 'Time (m)' : 'Tasks'
        
        individualSheet.addRow([
          entryDate,
          userName,
          task.category,
          task.name,
          unitType,
          item.count,
          item.calculated_time_minutes,
          dailyTotalTimeFormatted,
          dailyProductivity
        ])
      })
    })
    
    // Sheet 2: Team Output
    const teamSheet = workbook.addWorksheet(`team-output-${formattedDate}`)
    
    // Team sheet headers
    teamSheet.addRow([
      'Date', 'Category', 'Task', 'Unit Type', 'Count', 'Task Time Total (minutes)', 
      'Total Category Percentage', 'Total Task Percentage', 'Workload Target Achieved (%)'
    ])
    
    // Process team sheet data - aggregate by date
    const dateGroups: Record<string, any[]> = {}
    rawData?.forEach((entry: any) => {
      const dateKey = entry.entry_date
      if (!dateGroups[dateKey]) {
        dateGroups[dateKey] = []
      }
      dateGroups[dateKey].push(entry)
    })

    // Process each date group
    Object.entries(dateGroups)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([dateKey, entries]) => {
        const formattedDate = formatDateDDMMYYYY(dateKey)
        
        // Calculate daily team totals
        const dailyTaskTotals: Record<string, {
          category: string,
          count: number,
          calculated_time_minutes: number,
          measurement_type: 'tasks' | 'time',
          position: number,
          category_position: number
        }> = {}
        
        let dailyTotalTime = 0
        let activeStaffForDay = 0
        
        entries.forEach((entry: any) => {
          if (entry.total_calculated_time_minutes > 0) {
            activeStaffForDay++
          }
          
          entry.daily_entry_items.forEach((item: any) => {
            if (item.count > 0 && item.task) {
              const taskKey = `${item.task.category}-${item.task.name}`
              
              if (!dailyTaskTotals[taskKey]) {
                dailyTaskTotals[taskKey] = {
                  category: item.task.category,
                  count: 0,
                  calculated_time_minutes: 0,
                  measurement_type: item.task.measurement_type || 'tasks',
                  position: item.task.position || 999,
                  category_position: item.task.category_position || 999
                }
              }
              
              dailyTaskTotals[taskKey].count += item.count
              dailyTaskTotals[taskKey].calculated_time_minutes += item.calculated_time_minutes
              dailyTotalTime += item.calculated_time_minutes
            }
          })
        })
        
        // Calculate daily team productivity
        const expectedTeamMinutesForDay = 450 * activeStaffForDay
        const dailyTeamProductivity = activeStaffForDay > 0 
          ? Math.round((dailyTotalTime / expectedTeamMinutesForDay) * 100) 
          : 0
        
        // Calculate category totals for this day
        const dailyCategoryTotals: Record<string, number> = {}
        Object.values(dailyTaskTotals).forEach(task => {
          if (!dailyCategoryTotals[task.category]) {
            dailyCategoryTotals[task.category] = 0
          }
          dailyCategoryTotals[task.category] += task.calculated_time_minutes
        })
        
        // Add rows for this date, sorted by category and task position
        Object.entries(dailyTaskTotals)
          .sort(([, a], [, b]) => {
            const categoryCompare = a.category_position - b.category_position
            if (categoryCompare !== 0) return categoryCompare
            return a.position - b.position
          })
          .forEach(([taskKey, taskData]) => {
            const categoryTime = dailyCategoryTotals[taskData.category]
            const categoryPercentage = dailyTotalTime > 0 ? ((categoryTime / dailyTotalTime) * 100) : 0
            const taskPercentage = categoryTime > 0 ? ((taskData.calculated_time_minutes / categoryTime) * 100) : 0
            const unitType = taskData.measurement_type === 'time' ? 'Time (m)' : 'Tasks'
            
            const taskName = taskKey.split('-').slice(1).join('-') // Remove category prefix
            
            teamSheet.addRow([
              formattedDate,
              taskData.category,
              taskName,
              unitType,
              taskData.count,
              taskData.calculated_time_minutes,
              parseFloat(categoryPercentage.toFixed(1)),
              parseFloat(taskPercentage.toFixed(1)),
              dailyTeamProductivity
            ])
          })
      })
    
    // Style headers for both sheets
    const sheets = [individualSheet, teamSheet]
    sheets.forEach((sheet: ExcelJS.Worksheet) => {
      const headerRow = sheet.getRow(1)
      headerRow.font = { bold: true }
      
      // Auto-fit columns
      sheet.columns.forEach((column: Partial<ExcelJS.Column>) => {
        if (column) {
          column.width = 15
        }
      })
    })

    // Generate and download the file
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `team-output-${formattedDate}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Calculate team summary
  const activeUserCount = Object.keys(userData).length
  const totalUsers = users.length
  
  // Calculate team productivity accounting for date ranges
  const daysInPeriod = isDateRange 
    ? Math.ceil((new Date(selectedEndDate).getTime() - new Date(selectedStartDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
    : 1
  const expectedTeamMinutesPerPeriod = 450 * activeUserCount * daysInPeriod
  const teamProductivity = activeUserCount > 0 
    ? Math.round((Object.values(userData).reduce((sum, data) => sum + data.totalMinutes, 0) / expectedTeamMinutesPerPeriod) * 100) 
    : 0

  // Calculate category totals across all users with task details and position info
  const categoryTotals: Record<string, { 
    tasks: Record<string, { count: number, measurement_type: 'tasks' | 'time', duration: number, calculated_time_minutes: number, position: number }>,
    category_position: number
  }> = {}
  let totalTaskCount = 0
  let totalTeamTime = 0
  
  Object.values(userData).forEach(data => {
    Object.entries(data.categories).forEach(([category, categoryData]) => {
      if (!categoryTotals[category]) {
        categoryTotals[category] = {
          tasks: {},
          category_position: categoryData.category_position || 999
        }
      }
      categoryData.tasks.forEach(task => {
        if (!categoryTotals[category].tasks[task.task_name]) {
          categoryTotals[category].tasks[task.task_name] = {
            count: 0,
            measurement_type: task.measurement_type,
            duration: task.duration,
            calculated_time_minutes: 0,
            position: task.position || 999
          }
        }
        categoryTotals[category].tasks[task.task_name].count += task.count
        categoryTotals[category].tasks[task.task_name].calculated_time_minutes += task.calculated_time_minutes
        totalTaskCount += task.count
        totalTeamTime += task.calculated_time_minutes
      })
    })
  })

  return (
    <>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Output</h3>
      <p className="text-sm text-gray-600 mb-4">
        View completed tasks with calculated time and productivity ratios.
      </p>

      {/* Filters */}
      <div className="space-y-4 mb-6">
        {/* Date Preset Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              const today = format(new Date(), 'yyyy-MM-dd')
              setSelectedDate(today)
              setIsDateRange(false)
            }}
            className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
              !isDateRange && selectedDate === format(new Date(), 'yyyy-MM-dd')
                ? 'bg-[#334155] text-white border-[#334155]'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-[#475569] hover:text-white'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => {
              const yesterday = format(new Date(Date.now() - 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
              setSelectedDate(yesterday)
              setIsDateRange(false)
            }}
            className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
              !isDateRange && selectedDate === format(new Date(Date.now() - 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
                ? 'bg-[#334155] text-white border-[#334155]'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-[#475569] hover:text-white'
            }`}
          >
            Yesterday
          </button>
          <button
            onClick={() => {
              const today = new Date()
              const sevenDaysAgo = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000)
              setSelectedStartDate(format(sevenDaysAgo, 'yyyy-MM-dd'))
              setSelectedEndDate(format(today, 'yyyy-MM-dd'))
              setIsDateRange(true)
            }}
            className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
              isDateRange && selectedStartDate === format(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd') && selectedEndDate === format(new Date(), 'yyyy-MM-dd')
                ? 'bg-[#334155] text-white border-[#334155]'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-[#475569] hover:text-white'
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => {
              const today = new Date()
              const oneMonthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())
              setSelectedStartDate(format(oneMonthAgo, 'yyyy-MM-dd'))
              setSelectedEndDate(format(today, 'yyyy-MM-dd'))
              setIsDateRange(true)
            }}
            className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
              isDateRange && selectedStartDate === format(new Date(new Date().getFullYear(), new Date().getMonth() - 1, new Date().getDate()), 'yyyy-MM-dd') && selectedEndDate === format(new Date(), 'yyyy-MM-dd')
                ? 'bg-[#334155] text-white border-[#334155]'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-[#475569] hover:text-white'
            }`}
          >
            Last Month
          </button>
          <button
            onClick={() => {
              setIsDateRange(true)
              // Clear any preset selections when manually selecting date range
              if (selectedStartDate === selectedEndDate) {
                setSelectedEndDate(format(new Date(), 'yyyy-MM-dd'))
              }
            }}
            className={`px-3 py-1.5 text-sm rounded-md border transition-colors cursor-pointer ${
              isDateRange && !(
                (selectedStartDate === format(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd') && selectedEndDate === format(new Date(), 'yyyy-MM-dd')) ||
                (selectedStartDate === format(new Date(new Date().getFullYear(), new Date().getMonth() - 1, new Date().getDate()), 'yyyy-MM-dd') && selectedEndDate === format(new Date(), 'yyyy-MM-dd'))
              )
                ? 'bg-[#334155] text-white border-[#334155]'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-[#475569] hover:text-white'
            }`}
            style={{ userSelect: 'none' }}
          >
            Date Range
          </button>
        </div>

        {/* Date Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {!isDateRange ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <div className="relative">
                <input
                  type="date"
                  id="single-date-input"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                  style={{ 
                    cursor: 'pointer',
                    WebkitAppearance: 'none',
                    position: 'relative',
                    zIndex: 1
                  }}
                />
                <div 
                  className="absolute inset-0 cursor-pointer"
                  style={{ zIndex: 2 }}
                  onClick={() => {
                    const input = document.getElementById('single-date-input') as HTMLInputElement
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
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <div className="relative">
                  <input
                    type="date"
                    id="start-date-input"
                    value={selectedStartDate}
                    onChange={(e) => setSelectedStartDate(e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                    style={{ 
                      cursor: 'pointer',
                      WebkitAppearance: 'none',
                      position: 'relative',
                      zIndex: 1
                    }}
                  />
                  <div 
                    className="absolute inset-0 cursor-pointer"
                    style={{ zIndex: 2 }}
                    onClick={() => {
                      const input = document.getElementById('start-date-input') as HTMLInputElement
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <div className="relative">
                  <input
                    type="date"
                    id="end-date-input"
                    value={selectedEndDate}
                    onChange={(e) => setSelectedEndDate(e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                    style={{ 
                      cursor: 'pointer',
                      WebkitAppearance: 'none',
                      position: 'relative',
                      zIndex: 1
                    }}
                  />
                  <div 
                    className="absolute inset-0 cursor-pointer"
                    style={{ zIndex: 2 }}
                    onClick={() => {
                      const input = document.getElementById('end-date-input') as HTMLInputElement
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
            </>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Users</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Export Button */}
      <div className="mb-6 flex justify-end">
        <button
          onClick={exportToExcel}
          className="bg-[#334155] text-white px-4 py-2 rounded hover:bg-[#475569] transition-colors"
          disabled={Object.keys(userData).length === 0}
        >
          Export to Excel
        </button>
      </div>

      {/* Team Output Results */}
      <div id="teamOutputResults">
        {isLoading ? (
          <div className="text-center py-8">Loading...</div>
        ) : Object.keys(userData).length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No data found for the selected criteria
          </div>
        ) : (
          <>
            {/* Team Overview Header */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">TEAM OVERVIEW</h3>
            </div>

            {/* Team Summary */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">{activeUserCount}/{totalUsers}</div>
                  <div className="text-sm text-gray-600">Team Members</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">{teamProductivity}%</div>
                  <div className="text-sm text-gray-600">Team Productivity</div>
                </div>
              </div>
              
              <div className="space-y-2">
                {Object.entries(categoryTotals)
                  .sort(([, a], [, b]) => a.category_position - b.category_position)
                  .map(([category, categoryData]) => {
                  const categoryCount = Object.values(categoryData.tasks).reduce((sum, taskData) => sum + taskData.count, 0)
                  const categoryTime = Object.values(categoryData.tasks).reduce((sum, taskData) => sum + taskData.calculated_time_minutes, 0)
                  const percentage = totalTeamTime > 0 ? ((categoryTime / totalTeamTime) * 100) : 0
                  const percentageDisplay = percentage % 1 === 0 ? percentage.toFixed(0) : percentage.toFixed(1)
                  
                  return (
                    <div key={category}>
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold text-gray-700">{category}</h4>
                        <span className="font-bold text-gray-700">{percentageDisplay}%</span>
                      </div>
                      <div className="ml-4 space-y-1">
                        {Object.entries(categoryData.tasks)
                          .sort(([, a], [, b]) => a.position - b.position)
                          .map(([taskName, taskData]) => {
                          const taskTime = taskData.calculated_time_minutes
                          const taskPercentage = categoryTime > 0 ? ((taskTime / categoryTime) * 100) : 0
                          const taskPercentageDisplay = taskPercentage % 1 === 0 ? taskPercentage.toFixed(0) : taskPercentage.toFixed(1)
                          
                          const measurementDisplay = taskData.measurement_type === 'time' 
                            ? 'Time (m)' 
                            : `Tasks - ${taskData.duration}m`
                          
                          return (
                            <div key={taskName} className="flex justify-between text-sm text-gray-600">
                              <span>{taskName} ({measurementDisplay}) x {taskData.count}</span>
                              <div className="flex items-center gap-4">
                                <span className="w-12 text-right">{formatTimeHMM(taskTime)}</span>
                                <span className="w-12 text-right text-gray-500">{taskPercentageDisplay}%</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Individual Overview Header */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">INDIVIDUAL OVERVIEW</h3>
            </div>

            {/* Individual User Sections */}
            {Object.entries(userData).map(([userName, data]) => {
              const userTotalTasks = data.entries.reduce((sum, entry) => sum + entry.count, 0)
              // Calculate productivity accounting for date ranges
              const daysInPeriodForUser = isDateRange 
                ? Math.ceil((new Date(selectedEndDate).getTime() - new Date(selectedStartDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
                : 1
              const expectedMinutesForUser = 450 * daysInPeriodForUser // 450 minutes = 7.5 hours per day
              const productivity = Math.round((data.totalMinutes / expectedMinutesForUser) * 100)
              
              return (
                <div key={userName} className="mb-6 bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{userName}</h3>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">{productivity}%</div>
                      <div className="text-sm text-gray-500">{formatTimeHMM(data.totalMinutes)}</div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {Object.entries(data.categories)
                      .sort(([, a], [, b]) => (a.category_position || 999) - (b.category_position || 999))
                      .map(([category, categoryData]) => {
                      // Calculate total time for this category using actual calculated time
                      const categoryTotalTime = categoryData.tasks.reduce((sum, task) => sum + task.calculated_time_minutes, 0)
                      
                      // Calculate percentage based on time spent, not task count
                      const categoryPercentage = data.totalMinutes > 0 ? ((categoryTotalTime / data.totalMinutes) * 100) : 0
                      const percentageDisplay = categoryPercentage % 1 === 0 ? categoryPercentage.toFixed(0) : categoryPercentage.toFixed(1)
                      
                      return (
                        <div key={category}>
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-semibold text-gray-700">{category}</h4>
                            <span className="font-bold text-gray-700">{percentageDisplay}%</span>
                          </div>
                          <div className="ml-4 space-y-1">
                            {categoryData.tasks
                              .sort((a, b) => (a.position || 999) - (b.position || 999))
                              .map((task, idx) => {
                              const taskTime = task.calculated_time_minutes
                              const taskPercentage = categoryTotalTime > 0 ? ((taskTime / categoryTotalTime) * 100) : 0
                              const taskPercentageDisplay = taskPercentage % 1 === 0 ? taskPercentage.toFixed(0) : taskPercentage.toFixed(1)
                              
                              const measurementDisplay = task.measurement_type === 'time' 
                                ? 'Time (m)' 
                                : `Tasks - ${task.duration}m`
                              
                              return (
                                <div key={idx} className="flex justify-between text-sm text-gray-600">
                                  <span>{task.task_name} ({measurementDisplay}) x {task.count}</span>
                                  <div className="flex items-center gap-4">
                                    <span className="w-12 text-right">{formatTimeHMM(taskTime)}</span>
                                    <span className="w-12 text-right text-gray-500">{taskPercentageDisplay}%</span>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>
    </>
  )
}
