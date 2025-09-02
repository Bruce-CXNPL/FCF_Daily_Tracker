'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

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

interface PositionChange {
  taskId?: string
  category?: string
  position: number
  type: 'task' | 'category'
}

export default function TaskCalibration() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [editingTask, setEditingTask] = useState<string | null>(null)
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Record<string, number>>({})
  const [editCategoryName, setEditCategoryName] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<string | null>(null)
  const [newTask, setNewTask] = useState({
    name: '',
    category: '',
    expected_duration_minutes: 30,
    measurement_type: 'tasks' as 'tasks' | 'time',
    display_text: ''
  })
  const [newCategory, setNewCategory] = useState('')
  
  // Position management state
  const [positionChanges, setPositionChanges] = useState<PositionChange[]>([])
  const [hasPositionChanges, setHasPositionChanges] = useState(false)
  const [localPositions, setLocalPositions] = useState<Record<string, number>>({})
  const [migrationNeeded, setMigrationNeeded] = useState(false)
  const [positionColumnsExist, setPositionColumnsExist] = useState<boolean | null>(null)
  const [hasPendingChanges, setHasPendingChanges] = useState(false)

  useEffect(() => {
    fetchTasks()
    checkPositionColumns()
  }, [])

  const checkPositionColumns = async () => {
    try {
      // Try to query with position column to check if it exists
      const { data, error } = await supabase
        .from('tasks')
        .select('id, position')
        .limit(1)
      
      if (error && error.message.includes('column "position" does not exist')) {
        setPositionColumnsExist(false)
        setMigrationNeeded(true)
      } else {
        setPositionColumnsExist(true)
        setMigrationNeeded(false)
      }
    } catch (err) {
      console.error('Error checking position columns:', err)
      setPositionColumnsExist(false)
    }
  }

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('is_active', true)
      .order('category')
      .order('name')

    if (error) {
      console.error('Error fetching tasks:', error)
      return
    }

    // Initialize local positions for all tasks
    const newLocalPositions: Record<string, number> = {}
    
    // Group tasks by category first
    const tasksByCategory: Record<string, Task[]> = {}
    const categoryPositions: Record<string, number> = {}
    
    ;(data || []).forEach((task: Task) => {
      if (!tasksByCategory[task.category]) {
        tasksByCategory[task.category] = []
      }
      tasksByCategory[task.category].push(task)
      
      // Store the actual category position from the database (independent of task positions)
      if (task.category_position !== null && task.category_position !== undefined) {
        categoryPositions[task.category] = task.category_position
      }
    })
    
    // Assign default category positions for categories without positions
    const categoriesWithoutPositions = Object.keys(tasksByCategory).filter(cat => 
      categoryPositions[cat] === undefined
    )
    
    // Get the max existing category position
    const maxCategoryPosition = Math.max(0, ...Object.values(categoryPositions))
    
    categoriesWithoutPositions.forEach((category, index) => {
      categoryPositions[category] = maxCategoryPosition + index + 1
    })
    
    // Assign positions within each category
    Object.keys(tasksByCategory).forEach((category) => {
      // Store category position
      newLocalPositions[`category_${category}`] = categoryPositions[category]
      
      tasksByCategory[category].forEach((task, taskIndex) => {
        // Use existing task position if available, otherwise assign based on order within category
        const position = task.position || taskIndex + 1
        newLocalPositions[task.id] = position
      })
    })
    
    setLocalPositions(newLocalPositions)
    setTasks(data || [])
    
    // Extract unique categories in order
    const uniqueCategories = [...new Set((data || []).map((task: Task) => task.category) || [])] as string[]
    setCategories(uniqueCategories)
  }

  const handlePositionChange = (value: string, taskId?: string, category?: string, type: 'task' | 'category' = 'task') => {
    const position = parseInt(value) || 0
    
    // Only track the change, don't update display immediately
    setPositionChanges(prev => {
      const filtered = prev.filter(change => {
        if (type === 'task' && change.type === 'task') {
          return change.taskId !== taskId
        } else if (type === 'category' && change.type === 'category') {
          return change.category !== category
        }
        return true
      })
      
      return [...filtered, { taskId, category, position, type }]
    })
    
    setHasPositionChanges(true)
  }

  const savePositionChanges = async () => {
    // Check if position columns exist
    if (!positionColumnsExist) {
      alert('Position columns do not exist in the database. Please run the migration first:\n\n1. Go to your Supabase dashboard\n2. Navigate to SQL Editor\n3. Run the migration script from database/add_position_columns.sql')
      return
    }

    try {
      // Update category positions
      const categoryChanges = positionChanges.filter(change => change.type === 'category')
      for (const change of categoryChanges) {
        const { error } = await supabase
          .from('tasks')
          .update({ category_position: change.position })
          .eq('category', change.category)
          .eq('is_active', true)
        
        if (error) {
          console.error('Error updating category position:', error)
          if (error.message.includes('column "category_position" does not exist')) {
            alert('Position columns do not exist. Please run the database migration first.')
            return
          }
          throw error
        }
      }

      // Update task positions
      const taskChanges = positionChanges.filter(change => change.type === 'task')
      for (const change of taskChanges) {
        const { error } = await supabase
          .from('tasks')
          .update({ position: change.position })
          .eq('id', change.taskId)
        
        if (error) {
          console.error('Error updating task position:', error)
          if (error.message.includes('column "position" does not exist')) {
            alert('Position columns do not exist. Please run the database migration first.')
            return
          }
          throw error
        }
      }

      // Clear changes and refresh
      setPositionChanges([])
      setHasPositionChanges(false)
      fetchTasks()
      
      alert('Position changes saved successfully!')
    } catch (error) {
      console.error('Error saving position changes:', error)
      alert('Error saving position changes. Please check the console for details.')
    }
  }

  const getTaskPosition = (taskId: string) => {
    // Check if there's a pending change for this task
    const pendingChange = positionChanges.find(c => c.type === 'task' && c.taskId === taskId)
    if (pendingChange) {
      return pendingChange.position
    }
    // Otherwise use the current position
    return localPositions[taskId] || 0
  }

  const getCategoryPosition = (category: string) => {
    // Check if there's a pending change for this category
    const pendingChange = positionChanges.find(c => c.type === 'category' && c.category === category)
    if (pendingChange) {
      return pendingChange.position
    }
    // Otherwise use the current position
    return localPositions[`category_${category}`] || 0
  }

  const handleEditTask = (taskId: string) => {
    setEditingTask(taskId)
    const task = tasks.find(t => t.id === taskId)
    if (task) {
      setEditValues({ [taskId]: task.expected_duration_minutes })
    }
  }

  const handleSaveTask = async (taskId: string) => {
    const newDuration = editValues[taskId]
    
    if (!newDuration || newDuration < 1) {
      alert('Duration must be at least 1 minute')
      return
    }

    const { error } = await supabase
      .from('tasks')
      .update({ expected_duration_minutes: newDuration })
      .eq('id', taskId)

    if (error) {
      console.error('Error updating task:', error)
      alert('Error updating task duration')
      return
    }

    setEditingTask(null)
    fetchTasks()
  }

  const handleCancelTaskEdit = (taskId: string) => {
    setEditingTask(null)
    const task = tasks.find(t => t.id === taskId)
    if (task) {
      setEditValues({ [taskId]: task.expected_duration_minutes })
    }
  }

  const handleMeasurementTypeChange = async (taskId: string, measurementType: 'tasks' | 'time') => {
    const { error } = await supabase
      .from('tasks')
      .update({ measurement_type: measurementType })
      .eq('id', taskId)

    if (error) {
      console.error('Error updating measurement type:', error)
      if (error.message.includes('column "measurement_type" does not exist')) {
        alert('Measurement type feature requires a database migration. Please run the migration script from database/add_measurement_type_column.sql')
        return
      }
      alert('Error updating measurement type')
      return
    }

    fetchTasks()
  }

  const handleDisplayTextChange = async (taskId: string, displayText: string) => {
    const { error } = await supabase
      .from('tasks')
      .update({ display_text: displayText || null })
      .eq('id', taskId)

    if (error) {
      console.error('Error updating display text:', error)
      if (error.message.includes('column "display_text" does not exist')) {
        alert('Display text feature requires a database migration. Please run the migration script from database/add_display_text_column.sql')
        return
      }
      alert('Error updating display text')
      return
    }

    // Update local state immediately for better UX
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, display_text: displayText || undefined }
        : task
    ))
  }

  const handleDeleteTask = (taskId: string) => {
    setDeletingTaskId(taskId)
  }

  const confirmDeleteTask = async (taskId: string) => {
    const { error } = await supabase
      .from('tasks')
      .update({ is_active: false })
      .eq('id', taskId)

    if (error) {
      console.error('Error deleting task:', error)
      alert('Error deleting task')
      return
    }

    setDeletingTaskId(null)
    fetchTasks()
  }

  const cancelDeleteTask = () => {
    setDeletingTaskId(null)
  }

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault()

    // Get the max position for the category
    const categoryTasks = tasks.filter(t => t.category === newTask.category)
    const maxPosition = Math.max(0, ...categoryTasks.map(t => t.position || 0))

    const { error } = await supabase
      .from('tasks')
      .insert([{
        ...newTask,
        is_active: true,
        position: maxPosition + 1,
        category_position: getCategoryPosition(newTask.category)
      }])

    if (error) {
      console.error('Error adding task:', error)
      alert('Error adding task')
      return
    }

    setShowAddModal(false)
    setNewTask({ name: '', category: '', expected_duration_minutes: 30, measurement_type: 'tasks', display_text: '' })
    fetchTasks()
  }

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newCategory.trim()) {
      alert('Please enter a category name')
      return
    }

    const upperCategory = newCategory.trim().toUpperCase()
    
    if (categories.includes(upperCategory)) {
      alert('This category already exists')
      return
    }

    // Categories are created implicitly when tasks are added
    // Get the max category position
    const maxCategoryPosition = Math.max(0, ...tasks.map(t => t.category_position || 0))
    
    setCategories([...categories, upperCategory])
    setShowCategoryModal(false)
    setNewCategory('')
    
    // Set initial position for the new category
    handlePositionChange((maxCategoryPosition + 1).toString(), undefined, upperCategory, 'category')
  }

  const handleEditCategory = (category: string) => {
    setEditingCategory(category)
    setEditCategoryName(category)
  }

  const handleSaveCategory = async (oldCategory: string) => {
    if (!editCategoryName.trim()) {
      alert('Category name cannot be empty')
      return
    }

    const newCategoryName = editCategoryName.trim().toUpperCase()
    
    if (newCategoryName !== oldCategory && categories.includes(newCategoryName)) {
      alert('This category name already exists')
      return
    }

    if (newCategoryName === oldCategory) {
      setEditingCategory(null)
      return
    }

    // Update all tasks with this category
    const { error } = await supabase
      .from('tasks')
      .update({ category: newCategoryName })
      .eq('category', oldCategory)

    if (error) {
      console.error('Error updating category:', error)
      alert('Error updating category name')
      return
    }

    setEditingCategory(null)
    fetchTasks()
  }

  const handleCancelCategoryEdit = () => {
    setEditingCategory(null)
    setEditCategoryName('')
  }

  const handleDeleteCategory = (category: string) => {
    setDeletingCategory(category)
  }

  const confirmDeleteCategory = async (category: string) => {
    // Mark all tasks in this category as inactive
    const { error } = await supabase
      .from('tasks')
      .update({ is_active: false })
      .eq('category', category)

    if (error) {
      console.error('Error deleting category:', error)
      alert('Error deleting category')
      return
    }

    setDeletingCategory(null)
    fetchTasks()
  }

  const cancelDeleteCategory = () => {
    setDeletingCategory(null)
  }

  const getGroupedTasks = () => {
    // First, sort tasks by their positions within categories
    const sortedTasks = [...tasks].sort((a, b) => {
      // First sort by category position using local positions
      const categoryPosA = localPositions[`category_${a.category}`] || 0
      const categoryPosB = localPositions[`category_${b.category}`] || 0
      if (categoryPosA !== categoryPosB) {
        return categoryPosA - categoryPosB
      }
      
      // Then sort by task position within category using local positions
      const taskPosA = localPositions[a.id] || 0
      const taskPosB = localPositions[b.id] || 0
      return taskPosA - taskPosB
    })

    // Group the sorted tasks by category
    const grouped = sortedTasks.reduce((acc, task) => {
      if (!acc[task.category]) {
        acc[task.category] = []
      }
      acc[task.category].push(task)
      return acc
    }, {} as Record<string, Task[]>)

    // Sort each category's tasks by position using local positions
    Object.keys(grouped).forEach(category => {
      grouped[category].sort((a, b) => {
        const posA = localPositions[a.id] || 0
        const posB = localPositions[b.id] || 0
        return posA - posB
      })
    })

    return grouped
  }

  const groupedTasks = getGroupedTasks()

  // Get categories sorted by their position using local positions
  const sortedCategories = Object.keys(groupedTasks).sort((a, b) => {
    const categoryPosA = localPositions[`category_${a}`] || 0
    const categoryPosB = localPositions[`category_${b}`] || 0
    return categoryPosA - categoryPosB
  })

  return (
    <>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Calibration</h3>
      <p className="text-sm text-gray-600 mb-4">
        Manage task durations and categories. Changes will affect future time calculations.
      </p>
      
      {/* Migration Notice */}
      {migrationNeeded && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Database Migration Required</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>Position ordering is available but requires a database migration to persist changes.</p>
                <p className="mt-2">To enable position saving:</p>
                <ol className="list-decimal list-inside mt-1 space-y-1">
                  <li>Go to your Supabase dashboard</li>
                  <li>Navigate to SQL Editor</li>
                  <li>Run the migration script from <code className="bg-yellow-100 px-1 rounded">database/add_position_columns.sql</code></li>
                </ol>
                <p className="mt-2 text-xs">Note: You can still reorder items using the position inputs, but changes won't be saved until the migration is complete.</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Add New Task and Category Buttons */}
      <div className="mb-6 flex gap-3">
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-[#334155] text-white px-4 py-2 rounded hover:bg-[#1e293b] transition-colors"
        >
          Add New Task
        </button>
        <button
          onClick={() => setShowCategoryModal(true)}
          className="bg-[#334155] text-white px-4 py-2 rounded hover:bg-[#1e293b] transition-colors"
        >
          Create Category
        </button>
      </div>
      
      {/* Tasks List */}
      <div className="space-y-6">
        {sortedCategories.map((category) => {
          const categoryTasks = groupedTasks[category]
          return (
          <div key={category} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3 flex-1">
                {editingCategory === category ? (
                  <>
                    <input
                      type="text"
                      value={editCategoryName}
                      onChange={(e) => setEditCategoryName(e.target.value)}
                      className="text-lg font-semibold px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => handleSaveCategory(category)}
                      className="text-green-600 hover:text-green-800 text-sm"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelCategoryEdit}
                      className="text-gray-600 hover:text-gray-800 text-sm"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <h3 className="text-lg font-semibold text-gray-900 bg-gray-50 px-3 py-2 rounded">
                    {category}
                  </h3>
                )}
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Position:</span>
                  <input
                    type="number"
                    value={getCategoryPosition(category)}
                    onChange={(e) => handlePositionChange(e.target.value, undefined, category, 'category')}
                    className="w-16 px-2 py-1 text-center border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    min="1"
                  />
                </div>
                {editingCategory !== category && (
                  <div className="flex items-center gap-2">
                    {deletingCategory === category ? (
                      <div className="confirm-delete text-sm text-gray-600">
                        Are you sure?
                        <button
                          onClick={() => confirmDeleteCategory(category)}
                          className="ml-2 px-2 py-1 text-xs text-white bg-red-600 hover:bg-red-700 rounded transition-colors"
                        >
                          Yes
                        </button>
                        <button
                          onClick={cancelDeleteCategory}
                          className="ml-1 px-2 py-1 text-xs text-gray-600 bg-gray-200 hover:bg-gray-300 rounded transition-colors"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEditCategory(category)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              {categoryTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between py-2 px-3 bg-white border border-gray-100 rounded"
                >
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-sm font-medium text-gray-700">{task.name}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    {editingTask === task.id ? (
                      <>
                        <div className="flex items-center gap-2">
                          <div className="time-input-group">
                            <input
                              type="number"
                              value={editValues[task.id] || task.expected_duration_minutes}
                              onChange={(e) => setEditValues({
                                ...editValues,
                                [task.id]: parseInt(e.target.value) || 0
                              })}
                              min="1"
                              className="w-12 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                            <span className="text-sm text-gray-500">min</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleSaveTask(task.id)}
                            className="text-green-600 hover:text-green-800 text-sm"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => handleCancelTaskEdit(task.id)}
                            className="text-gray-600 hover:text-gray-800 text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <select
                            value={task.measurement_type || 'tasks'}
                            onChange={(e) => handleMeasurementTypeChange(task.id, e.target.value as 'tasks' | 'time')}
                            className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="tasks">Tasks</option>
                            <option value="time">Time (m)</option>
                          </select>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="time-input-group">
                            {task.measurement_type === 'time' ? (
                              <span className="w-12 text-right text-gray-400">-</span>
                            ) : (
                              <span className="w-12 text-right">{task.expected_duration_minutes}</span>
                            )}
                            <span className="text-sm text-gray-500">min</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={task.display_text || ''}
                            onChange={(e) => handleDisplayTextChange(task.id, e.target.value)}
                            placeholder="Custom display text"
                            className="w-32 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          {deletingTaskId === task.id ? (
                            <div className="confirm-delete text-sm text-gray-600">
                              Are you sure?
                              <button
                                onClick={() => confirmDeleteTask(task.id)}
                                className="ml-2 px-2 py-1 text-xs text-white bg-red-600 hover:bg-red-700 rounded transition-colors"
                              >
                                Yes
                              </button>
                              <button
                                onClick={cancelDeleteTask}
                                className="ml-1 px-2 py-1 text-xs text-gray-600 bg-gray-200 hover:bg-gray-300 rounded transition-colors"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEditTask(task.id)}
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">Pos:</span>
                          <input
                            type="number"
                            value={getTaskPosition(task.id)}
                            onChange={(e) => handlePositionChange(e.target.value, task.id)}
                            className="w-16 px-2 py-1 text-center border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            min="1"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          )
        })}
      </div>

      {/* Save Changes Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={savePositionChanges}
          className="bg-[#1e3a8a] text-white px-6 py-2 rounded hover:bg-[#1e40af] transition-colors"
        >
          Save Changes
        </button>
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Add New Task</h3>
            <form onSubmit={handleAddTask}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={newTask.category}
                  onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Task Name</label>
                <input
                  type="text"
                  value={newTask.name}
                  onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Measurement Type</label>
                <select
                  value={newTask.measurement_type}
                  onChange={(e) => setNewTask({ ...newTask, measurement_type: e.target.value as 'tasks' | 'time' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="tasks">Tasks</option>
                  <option value="time">Time (m)</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Custom Display Text (optional)
                </label>
                <input
                  type="text"
                  value={newTask.display_text}
                  onChange={(e) => setNewTask({ ...newTask, display_text: e.target.value })}
                  placeholder="Leave empty to use default measurement type indicator"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              {newTask.measurement_type === 'tasks' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expected Duration (minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newTask.expected_duration_minutes}
                    onChange={(e) => setNewTask({
                      ...newTask,
                      expected_duration_minutes: parseInt(e.target.value) || 30
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              )}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#334155] text-white rounded-md hover:bg-[#1e293b] transition-colors"
                >
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Create New Category</h3>
            <form onSubmit={handleCreateCategory}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#334155] text-white rounded-md hover:bg-[#1e293b] transition-colors"
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
