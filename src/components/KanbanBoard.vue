<template>
  <div class="kanban-board">
    <div class="kanban-header">
      <div class="header-content">
        <h1>DLC Meals</h1>
        <div class="date-time">
          <div class="date">{{ currentDate }}</div>
          <div class="time">{{ currentTime }}</div>
          <div class="week-range">{{ weekRange }}</div>
        </div>
      </div>
      <div class="header-links">
        <a href="#" :class="{ active: activeView === 'daddy' }" @click.prevent="setActiveView('daddy')">Daddy</a>
        <a href="#" :class="{ active: activeView === 'family' }" @click.prevent="setActiveView('family')">Family</a>
      </div>
      <div class="weekly-total">Total: {{ viewTotalCalories }} kcal</div>
      <button class="add-task-btn" @click="openModal">
        <i class="fas fa-plus"></i> Add Meal
      </button>
    </div>

    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading tasks...</p>
    </div>

    <div v-else class="kanban-columns">
      <TaskList
        v-for="status in statuses"
        :key="status"
        :title="formatStatus(status)"
        :tasks="getTasksByStatus(status)"
        @task-moved="handleTaskMoved"
        @update:tasks="(updatedTasks) => handleTasksUpdate(updatedTasks, status)"
        @open-task="openModal"
      />
    </div>

    <footer class="page-footer">
      <div class="build-info">
        <span>Build: {{ buildNumber }}</span>
      </div>
    </footer>

    <TaskModal
      :is-open="showModal"
      :task="selectedTask"
      :active-view="activeView"
      @close="closeModal"
      @save="handleTaskSave"
      @delete="handleTaskDelete"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, defineAsyncComponent, computed } from 'vue'
import TaskList from './TaskList.vue'
import { subscribeToTasks, addTask, updateTask, deleteTask } from '../services/firebaseService'

// Lazy load TaskModal
const TaskModal = defineAsyncComponent(() => 
  import('./TaskModal.vue')
)

const tasks = ref([])
const showModal = ref(false)
const selectedTask = ref(null)
const isLoading = ref(true)
const unsubscribe = ref(null)
const activeView = ref('daddy')

const statuses = ['monday', 'tuesday', 'wednesday', 'thursday','friday','saturday','sunday']

// Generate build number from timestamp
const buildNumber = new Date().getTime()

const currentTime = computed(() => {
  return new Date().toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  })
})

const currentDate = computed(() => {
  return new Date().toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
})

// Add computed property for week range
const weekRange = computed(() => {
  const today = new Date()
  const currentDay = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - currentDay + 1) // +1 because we want Monday to be 1
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  
  return `${monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
})

// Add computed property for total weekly calories
const totalWeeklyCalories = computed(() => {
  return tasks.value.reduce((total, task) => {
    return total + (parseInt(task.calories) || 0)
  }, 0)
})

// Add computed property for view-specific total calories
const viewTotalCalories = computed(() => {
  return tasks.value
    .filter(task => (task.view || 'daddy') === activeView.value)
    .reduce((total, task) => {
      return total + (parseInt(task.calories) || 0)
    }, 0).toLocaleString()
})

onMounted(() => {
  console.log('Setting up Firebase subscription...')
  unsubscribe.value = subscribeToTasks((newTasks) => {
    console.log('Received tasks from Firebase:', newTasks)
    tasks.value = newTasks
    isLoading.value = false
  })
})

onUnmounted(() => {
  console.log('Cleaning up Firebase subscription...')
  if (unsubscribe.value) {
    unsubscribe.value()
  }
})

const handleTaskMoved = async (taskId, newStatus) => {
  try {
    console.log('Moving task:', taskId, 'to status:', newStatus)
    
    // Find the task in the local state
    const taskIndex = tasks.value.findIndex(task => task.id === taskId)
    if (taskIndex === -1) {
      console.error('Task not found in local state:', taskId)
      return
    }

    // Convert 'new' to 'todo' for Firestore storage
    const statusToStore = newStatus === 'new' ? 'todo' : newStatus

    // Update the task status in Firestore
    await updateTask(taskId, { 
      status: statusToStore,
      updatedAt: new Date().toISOString()
    })

    // Update the local state
    tasks.value[taskIndex] = {
      ...tasks.value[taskIndex],
      status: statusToStore,
      updatedAt: new Date().toISOString()
    }

    console.log('Task moved successfully')
  } catch (error) {
    console.error('Error moving task:', error)
    alert('Failed to move task. Please check the console for details.')
  }
}

const handleTaskSave = async (taskData) => {
  try {
    console.log('Starting task save operation...')
    if (!taskData.title) {
      throw new Error('Task title is required')
    }

    if (selectedTask.value?.id) {
      console.log('Updating existing task:', selectedTask.value.id)
      await updateTask(selectedTask.value.id, taskData)
      console.log('Task updated successfully')
    } else {
      console.log('Creating new task:', taskData)
      // Create a clean copy of the task data without any undefined properties
      const cleanTaskData = {
        title: taskData.title,
        description: taskData.description || '',
        status: taskData.status || 'monday',
        dueDate: taskData.dueDate || null,
        images: taskData.images || [],
        comments: taskData.comments || [],
        mealType: taskData.mealType || 'breakfast',
        view: activeView.value,
        createdAt: new Date().toISOString()
      }
      console.log('Clean task data:', cleanTaskData)
      const taskId = await addTask(cleanTaskData)
      console.log('New task created with ID:', taskId)
    }
    showModal.value = false
    selectedTask.value = null
  } catch (error) {
    console.error('Error saving task:', error)
    alert(`Failed to save task: ${error.message || 'Unknown error occurred'}`)
  }
}

const openModal = (task = null) => {
  selectedTask.value = task
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  selectedTask.value = null
}

const formatStatus = (status) => {
  return status.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')
}

const getTasksByStatus = (status) => {
  // Convert the status to match the format in Firestore (with hyphens)
  const formattedStatus = status.toLowerCase().split(' ').join('-')
  return tasks.value
    .filter(task => {
      // First filter by active view, defaulting to 'daddy' if view is not set
      const taskView = task.view || 'daddy'
      if (taskView === activeView.value) {
        const taskStatus = task.status.toLowerCase()
        if (formattedStatus === 'new' && taskStatus === 'todo') return true
        if (formattedStatus === 'todo' && taskStatus === 'new') return true
        return taskStatus === formattedStatus
      }
      return false
    })
    .sort((a, b) => {
      // Sort by createdAt timestamp, oldest first
      const dateA = new Date(a.createdAt || a.updatedAt)
      const dateB = new Date(b.createdAt || b.updatedAt)
      return dateA - dateB
    })
}

const handleTasksUpdate = (updatedTasks, status) => {
  // Update the tasks array with the new tasks for this status
  const otherTasks = tasks.value.filter(task => task.status !== status)
  tasks.value = [...otherTasks, ...updatedTasks]
}

const handleTaskDelete = async (taskId) => {
  try {
    console.log('Deleting task:', taskId)
    await deleteTask(taskId)
    console.log('Task deleted successfully')
  } catch (error) {
    console.error('Error deleting task:', error)
    alert('Failed to delete task. Please check the console for details.')
  }
}

const setActiveView = (view) => {
  activeView.value = view
}
</script>

<style scoped>
.kanban-board {
  padding: 20px;
  min-height: 100vh;
  background: #2D303E;
  color: #ffffff;
}

.kanban-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  position: relative;
}

.kanban-header h1 {
  margin: 0;
  color: #ffffff;
}

.kanban-header .header-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.header-links {
  position: absolute;
  left: 50%;
  top: 0;
  transform: translateX(-50%);
  display: flex;
  gap: 24px;
  padding-top: 4px;
  padding: 4px 16px 0 16px;
  border-radius: 8px;
}

.header-links a {
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  font-size: 14px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
  position: relative;
}

.header-links a.active {
  color: #EA7C69;
}

.header-links a.active::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  right: 0;
  height: 3px;
  background: #EA7C69;
  border-radius: 2px;
}

.weekly-total {
  position: absolute;
  left: 50%;
  top: 40px;
  transform: translateX(-50%);
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  padding: 2px 12px;
  border-radius: 4px;
}

.add-task-btn {
  background-color: #EA7C69;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  transition: background-color 0.2s;
  margin-top: 4px;
}

.add-task-btn:hover {
  background-color: #d86b57;
}

.kanban-columns {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding: 20px 16px;
  width: 100%;
  align-items: flex-end;
}

.kanban-column {
  flex: 1;
  min-width: 0;
  width: 25%;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  background-color: #5B5F63;
}

.kanban-column:nth-child(odd) {
  background-color: #1F1D2B;
}

.kanban-column:nth-child(even) {
  background-color: #5B5F63;
}

@media (max-width: 768px) {
  .kanban-header h1 {
    font-size: 2.4rem;
  }
  .kanban-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .kanban-header .header-content {
    justify-content: center;
  }

  .header-links {
    position: static;
    transform: none;
    margin: 16px 0;
    order: 2;
  }

  .add-task-btn {
    order: 3;
  }

  .kanban-columns {
    flex-direction: column;
    gap: 24px;
    overflow-x: visible;
    padding-bottom: 0;
  }

  .kanban-column {
    width: 100%;
    min-width: 100%;
  }

  .task-list {
    overflow-x: auto;
    padding-bottom: 16px;
  }

  .task-list-content {
    min-width: 100%;
    display: flex;
    gap: 16px;
  }

  .task-card {
    min-width: 280px;
    flex-shrink: 0;
  }
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  gap: 16px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #5B5F63;
  border-top: 4px solid #25292E;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-container p {
  color: #ffffff;
  margin: 0;
  font-size: 14px;
}

.page-footer {
  margin-top: 40px;
  padding: 16px;
  text-align: center;
}

.build-info {
  font-size: 12px;
  color: #ffffff;
  opacity: 0.7;
  font-family: monospace;
}

@media (max-width: 768px) {
  .page-footer {
    margin-top: 24px;
    padding: 12px;
  }

  .build-info {
    font-size: 10px;
  }
}

.date-time {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.time {
  font-weight: 500;
}

.date {
  opacity: 0.8;
}

.week-range {
  font-size: 12px;
  opacity: 0.7;
}
</style>
