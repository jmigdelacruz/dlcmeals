<template>
  <div class="kanban-board">
    <div class="kanban-header">
      <div class="header-content">
        <h1>DLC Meals</h1>
        <div class="date-time">
          <div class="date">{{ currentDate }}</div>
          <div class="time">{{ currentTime }}</div>
          <div class="week-range" @click.stop="toggleWeekPicker">
            <span>
              {{ weekRange }}
              <i class="fas fa-calendar-alt"></i>
            </span>
            <WeekPicker
              v-if="showWeekPicker"
              v-model="selectedWeekStart"
              :is-open="showWeekPicker"
              @close="showWeekPicker = false"
              @update:modelValue="handleWeekSelect"
            />
          </div>
        </div>
      </div>
      <div class="header-links">
        <div class="view-link">
          <a href="#" :class="{ active: activeView === 'daddy' }" @click.prevent="setActiveView('daddy')">Daddy</a>
          <div v-if="activeView === 'daddy'" class="weekly-total" :class="{ 'blink': isWeeklyTotalBlinking }">{{ viewTotalCalories }} kcal</div>
        </div>
        <div class="view-link">
          <a href="#" :class="{ active: activeView === 'family' }" @click.prevent="setActiveView('family')">Family</a>
          <div v-if="activeView === 'family'" class="weekly-total" :class="{ 'blink': isWeeklyTotalBlinking }">{{ viewTotalCalories }} kcal</div>
        </div>
      </div>
      <button class="add-task-btn" @click="openModal">
        <i class="fas fa-plus"></i> Add Meal
      </button>
    </div>

    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading tasks...</p>
    </div>

    <div v-else class="kanban-columns">
      <button class="nav-arrow prev-week" @click="navigateWeek(-1)">
        <i class="fas fa-chevron-left"></i>
      </button>
      <div class="columns-container" :key="animationKey">
        <TaskList
          v-for="(status, index) in statuses"
          :key="status"
          :title="formatStatus(status)"
          :tasks="getTasksByStatus(status)"
          :class="{ 
            'wave-animation': isAnimating && activeColumnIndex >= index,
            'wave-left': waveDirection === 'left',
            'wave-right': waveDirection === 'right'
          }"
          @task-moved="handleTaskMoved"
          @update:tasks="(updatedTasks) => handleTasksUpdate(updatedTasks, status)"
          @open-task="openModal"
          @animationend="activeColumnIndex = index + 1"
        />
      </div>
      <button class="nav-arrow next-week" @click="navigateWeek(1)">
        <i class="fas fa-chevron-right"></i>
      </button>
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
      :modal-title="selectedTask ? 'View & Edit Meal' : 'New Meal'"
      @close="closeModal"
      @save="handleTaskSave"
      @delete="handleTaskDelete"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, defineAsyncComponent, computed, watch, nextTick } from 'vue'
import TaskList from './TaskList.vue'
import WeekPicker from './WeekPicker.vue'
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

// Add new refs for week selection
const selectedWeekStart = ref(new Date())
const showWeekPicker = ref(false)

// Update weekRange computed property
const weekRange = computed(() => {
  const monday = new Date(selectedWeekStart.value)
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
  // Create dates for the week range, normalized to midnight
  const monday = new Date(selectedWeekStart.value)
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  
  const filteredTasks = tasks.value.filter(task => {
    const taskView = task.view || 'daddy'
    if (taskView !== activeView.value) return false
    
    let taskDate
    try {
      // Try to parse the mealDate, fallback to createdAt if mealDate is invalid
      taskDate = task.mealDate ? new Date(task.mealDate) : new Date(task.createdAt)
      if (isNaN(taskDate.getTime())) {
        taskDate = new Date(task.createdAt)
      }
      // Normalize task date to midnight for comparison
      taskDate.setHours(0, 0, 0, 0)
    } catch (error) {
      console.error('Error parsing date for task:', task.title, error)
      taskDate = new Date(task.createdAt)
      taskDate.setHours(0, 0, 0, 0)
    }
    
    return taskDate >= monday && taskDate <= sunday
  })
  
  return filteredTasks.reduce((total, task) => total + (parseInt(task.calories) || 0), 0).toLocaleString()
})

// Add ref for animation
const isAnimating = ref(false)
const waveDirection = ref('left')
const activeColumnIndex = ref(0)

// Add ref for animation key
const animationKey = ref(0)

// Add ref for blink animation
const isWeeklyTotalBlinking = ref(false)

// Update the watcher to watch both totalWeeklyCalories and selectedWeekStart
watch([totalWeeklyCalories, selectedWeekStart], () => {
  isWeeklyTotalBlinking.value = true
  setTimeout(() => {
    isWeeklyTotalBlinking.value = false
  }, 1000) // Duration of the blink animation
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
        calories: taskData.calories || null,
        mealDate: taskData.mealDate || null,
        view: activeView.value,
        createdAt: new Date().toISOString()
      }
      console.log('Clean task data:', cleanTaskData)
      await addTask(cleanTaskData)
      console.log('New task created successfully')
    }
    showModal.value = false
    selectedTask.value = null
  } catch (error) {
    console.error('Error saving task:', error)
    alert(`Failed to save task: ${error.message || 'Unknown error occurred'}`)
  }
}

const openModal = (task = null) => {
  console.log('Opening modal with task:', task)
  // If task is a PointerEvent (click event), set it to null
  selectedTask.value = task instanceof PointerEvent ? null : task
  console.log('selectedTask after setting:', selectedTask.value)
  console.log('Modal title will be:', selectedTask.value ? 'View & Edit Meal' : 'New Meal')
  showModal.value = true
}

// Add a watch for selectedTask
watch(selectedTask, (newValue) => {
  console.log('selectedTask changed:', newValue)
  console.log('Modal title will be:', newValue ? 'View & Edit Meal' : 'New Meal')
})

// Add a watch for showModal
watch(showModal, (newValue) => {
  console.log('showModal changed:', newValue)
  console.log('Current selectedTask:', selectedTask.value)
  console.log('Modal title will be:', selectedTask.value ? 'View & Edit Meal' : 'New Meal')
})

const closeModal = () => {
  console.log('Closing modal, current selectedTask:', selectedTask.value)
  showModal.value = false
  selectedTask.value = null
  console.log('After closing modal, selectedTask:', selectedTask.value)
}

const formatStatus = (status) => {
  return status.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')
}

const getTasksByStatus = (status) => {
  const formattedStatus = status.toLowerCase().split(' ').join('-')
  
  // Create dates for the week range, normalized to midnight
  const monday = new Date(selectedWeekStart.value)
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  
  console.log('Filtering tasks for status:', formattedStatus)
  console.log('Week range:', monday.toISOString(), 'to', sunday.toISOString())
  console.log('Total tasks before filtering:', tasks.value.length)
  
  const filteredTasks = tasks.value
    .filter(task => {
      const taskView = task.view || 'daddy'
      if (taskView === activeView.value) {
        const taskStatus = task.status.toLowerCase()
        
        // Check if task is within selected week
        let taskDate
        try {
          // Try to parse the mealDate, fallback to createdAt if mealDate is invalid
          taskDate = task.mealDate ? new Date(task.mealDate) : new Date(task.createdAt)
          if (isNaN(taskDate.getTime())) {
            taskDate = new Date(task.createdAt)
          }
          // Normalize task date to midnight for comparison
          taskDate.setHours(0, 0, 0, 0)
        } catch (error) {
          console.error('Error parsing date for task:', task.title, error)
          taskDate = new Date(task.createdAt)
          taskDate.setHours(0, 0, 0, 0)
        }
        
        const isInWeek = taskDate >= monday && taskDate <= sunday
        
        // For tasks with dates behind today, show them in the appropriate day column
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const isBehindToday = taskDate < today
        
        // If task is behind today, show it in the day column that matches its mealDate
        if (isBehindToday) {
          const taskDay = taskDate.getDay()
          const dayMap = {
            0: 'sunday',
            1: 'monday',
            2: 'tuesday',
            3: 'wednesday',
            4: 'thursday',
            5: 'friday',
            6: 'saturday'
          }
          return dayMap[taskDay] === formattedStatus
        }
        
        // For current and future tasks, show them based on their status
        const matchesStatus = taskStatus === formattedStatus
        return matchesStatus && isInWeek
      }
      return false
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt || a.updatedAt)
      const dateB = new Date(b.createdAt || b.updatedAt)
      return dateA - dateB
    })
    
  console.log('Filtered tasks for', formattedStatus, ':', filteredTasks.length)
  return filteredTasks
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
  // Reset animation state first
  isAnimating.value = false
  activeColumnIndex.value = 0
  animationKey.value++ // Force re-render
  
  // Force a re-render by using nextTick
  nextTick(() => {
    // Start animation
    isAnimating.value = true
    waveDirection.value = 'left'
    
    // Update the view
    activeView.value = view
    
    // Reset animation after all columns complete
    setTimeout(() => {
      isAnimating.value = false
      activeColumnIndex.value = 0
    }, 500 * statuses.length)
  })
}

// Update handleWeekSelect method
const handleWeekSelect = (date) => {
  // Reset animation state first
  isAnimating.value = false
  activeColumnIndex.value = 0
  animationKey.value++ // Force re-render
  
  // Force a re-render by using nextTick
  nextTick(() => {
    // Start animation
    isAnimating.value = true
    waveDirection.value = 'left'
    
    // Update the date
    selectedWeekStart.value = date
    showWeekPicker.value = false
    
    // Reset animation after all columns complete
    setTimeout(() => {
      isAnimating.value = false
      activeColumnIndex.value = 0
    }, 500 * statuses.length)
  })
}

// Update navigateWeek method
const navigateWeek = (direction) => {
  // Reset animation state first
  isAnimating.value = false
  activeColumnIndex.value = 0
  animationKey.value++ // Force re-render
  
  // Force a re-render by using nextTick
  nextTick(() => {
    // Start animation
    isAnimating.value = true
    waveDirection.value = direction > 0 ? 'left' : 'right'
    
    // Update the date
    const newDate = new Date(selectedWeekStart.value)
    newDate.setDate(newDate.getDate() + (direction * 7))
    selectedWeekStart.value = newDate
    
    // Reset animation after all columns complete
    setTimeout(() => {
      isAnimating.value = false
      activeColumnIndex.value = 0
    }, 500 * statuses.length)
  })
}

// Update the week-range click handler
const toggleWeekPicker = () => {
  showWeekPicker.value = !showWeekPicker.value
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

.view-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
  position: relative;
}

.view-link:hover a {
  color: #ffffff;
}

.view-link:hover a.active::after {
  left: -8px;
  right: -8px;
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
  transition: all 0.2s ease;
}

.weekly-total {
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  padding: 2px 12px;
  border-radius: 4px;
  backdrop-filter: blur(4px);
  margin-top: 4px;
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
  position: relative;
  align-items: flex-end;
  padding: 12px 0px;
}

.columns-container {
  display: flex;
  gap: 16px;
  flex: 1;
  overflow-x: auto;
  align-items: flex-end;
  padding: 8px 0;
  margin: -8px 0;
  position: relative;
}

.wave-animation {
  animation: wave 0.5s ease-in-out;
  animation-fill-mode: forwards;
}

.wave-left {
  animation-name: waveLeft;
}

.wave-right {
  animation-name: waveRight;
}

@keyframes waveLeft {
  0% {
    transform: scaleX(1);
  }
  25% {
    transform: scaleX(1.02);
  }
  50% {
    transform: scaleX(0.98);
  }
  75% {
    transform: scaleX(1.01);
  }
  100% {
    transform: scaleX(1);
  }
}

@keyframes waveRight {
  0% {
    transform: scaleX(1);
  }
  25% {
    transform: scaleX(0.98);
  }
  50% {
    transform: scaleX(1.02);
  }
  75% {
    transform: scaleX(0.99);
  }
  100% {
    transform: scaleX(1);
  }
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
  align-items: flex-start;
}

.time {
  font-weight: 500;
}

.date {
  opacity: 0.8;
}

.week-range {
  font-size: 12px;
  opacity: 0.9;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px 2px 0;
  border-radius: 4px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  width: fit-content;
  margin-left: 0;
  position: relative;
  z-index: 1000;
}

.week-range span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.week-range:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-1px);
}

.week-range:hover span {
  transform: translateX(2px);
}

.week-range i {
  font-size: 10px;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.week-range:hover i {
  transform: rotate(15deg);
}

.modal-overlay,
.week-picker-modal,
.week-picker-header,
.week-picker-content,
.input-group,
.week-picker-input {
  display: none;
}

.nav-arrow {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;
  flex-shrink: 0;
  align-self: center;
  outline: none;
}

.nav-arrow:focus {
  outline: none;
  box-shadow: none;
}

.nav-arrow:hover {
  color: #ffffff;
}

.nav-arrow i {
  font-size: 20px;
}

@media (max-width: 768px) {
  .nav-arrow {
    position: fixed;
    top: 50%;
    transform: translateY(-50%);
    width: 40px;
    height: 40px;
    z-index: 100;
  }

  .prev-week {
    left: 10px;
  }

  .next-week {
    right: 10px;
  }
}

@keyframes blink {
  0% { color: rgba(255, 255, 255, 0.7); }
  25% { color: #EA7C69; }
  50% { color: rgba(255, 255, 255, 0.7); }
  75% { color: #EA7C69; }
  100% { color: rgba(255, 255, 255, 0.7); }
}

.weekly-total.blink {
  animation: blink 1s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: color;
}
</style>
