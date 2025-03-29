<template>
  <div class="task-list" :class="{ today: isToday }" :style="{ flex: columnWidth }">
    <div class="task-list-header" :class="{ 'not-today': !isToday }">
      <div class="day-title">
        <h2>{{ formattedTitle }}</h2>
        <div class="day-date">{{ formatDayDate(title) }}</div>
      </div>
      <span class="task-count">{{ totalCalories }} kcal</span>
    </div>
    <div class="task-list-container">
      <button 
        v-if="isMobile" 
        class="scroll-button scroll-left" 
        @click="scrollLeft"
        :disabled="!canScrollLeft"
      >
        <i class="fas fa-chevron-left"></i>
      </button>
      <draggable
        ref="draggableRef"
        :list="tasks"
        group="tasks"
        item-key="id"
        class="task-list-content"
        :animation="150"
        ghost-class="ghost-card"
        :direction="isMobile ? 'vertical' : 'horizontal'"
        @change="handleDragChange"
      >
        <template #item="{ element }">
          <TaskCard
            :task="element"
            :isToday="isToday"
            :isBehindToday="isBehindToday"
            :columnDate="getColumnDate(title)"
            @open-task="$emit('open-task', element)"
          />
        </template>
      </draggable>
      <button 
        v-if="isMobile" 
        class="scroll-button scroll-right" 
        @click="scrollRight"
        :disabled="!canScrollRight"
      >
        <i class="fas fa-chevron-right"></i>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted, defineAsyncComponent } from 'vue'

// Lazy load both TaskCard and draggable
const TaskCard = defineAsyncComponent(() => 
  import('./TaskCard.vue')
)

const draggable = defineAsyncComponent(() => 
  import('vuedraggable')
)

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  tasks: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['update:tasks', 'task-moved', 'open-task'])
const isMobile = ref(false)
const draggableRef = ref(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)

const dayMap = {
  'sunday': 0,
  'monday': 1,
  'tuesday': 2,
  'wednesday': 3,
  'thursday': 4,
  'friday': 5,
  'saturday': 6
}

const isToday = computed(() => {
  const today = new Date().getDay()
  return dayMap[props.title.toLowerCase()] === today
})

const columnWidth = computed(() => {
  const today = new Date().getDay()
  const currentDay = dayMap[props.title.toLowerCase()]
  const distance = currentDay - today
  
  // Today's column gets 1.6, the next day gets 1.3, others get progressively smaller
  if (distance === 0) return 1.6
  if (distance === 1 || distance === -6) return 1.3  // Handle next day, including Sunday when today is Saturday
  if (distance === 2 || distance === -5) return 0.6
  if (distance === 3 || distance === -4) return 0.6
  return 0.6
})

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

const totalCalories = computed(() => {
  return props.tasks.reduce((sum, task) => {
    const calories = parseInt(task.calories) || 0
    return sum + calories
  }, 0)
})

const formattedTitle = computed(() => {
  return props.title.slice(0, 3).toUpperCase()
})

const isBehindToday = computed(() => {
  const today = new Date().getDay()
  const currentDay = dayMap[props.title.toLowerCase()]
  
  // Adjust for week starting on Monday (0) and ending on Sunday (6)
  const adjustedToday = today === 0 ? 6 : today - 1  // Convert Sunday (0) to 6
  const adjustedCurrentDay = currentDay === 0 ? 6 : currentDay - 1  // Convert Sunday (0) to 6
  
  return adjustedCurrentDay < adjustedToday
})

const formatDayDate = (day) => {
  const today = new Date()
  const currentDay = dayMap[day.toLowerCase()]
  const daysUntilTarget = currentDay - today.getDay()
  const targetDate = new Date(today)
  targetDate.setDate(today.getDate() + daysUntilTarget)
  
  return targetDate.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit'
  })
}

const getColumnDate = (day) => {
  const today = new Date()
  const currentDay = dayMap[day.toLowerCase()]
  const daysUntilTarget = currentDay - today.getDay()
  const targetDate = new Date(today)
  targetDate.setDate(today.getDate() + daysUntilTarget)
  return targetDate.toISOString().split('T')[0] // Returns YYYY-MM-DD format
}

const checkMobile = () => {
  // Check if the device is mobile using multiple methods
  const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                        window.innerWidth <= 768 ||
                        window.matchMedia('(max-width: 768px)').matches;
  
  isMobile.value = isMobileDevice;
  if (isMobileDevice) {
    // Add a small delay to ensure the DOM is ready
    setTimeout(() => {
      checkScrollButtons();
    }, 100);
  }
}

const checkScrollButtons = () => {
  const container = draggableRef.value?.$el
  if (!container) return
  
  // Add a small delay to ensure the scroll position is updated
  setTimeout(() => {
    canScrollLeft.value = container.scrollLeft > 0
    canScrollRight.value = container.scrollLeft < (container.scrollWidth - container.clientWidth - 1) // Add small buffer
  }, 50)
}

const scrollLeft = () => {
  const container = draggableRef.value?.$el
  if (!container) return
  
  container.scrollBy({
    left: -300,
    behavior: 'smooth'
  })
  
  // Check scroll buttons after scrolling
  setTimeout(checkScrollButtons, 300)
}

const scrollRight = () => {
  const container = draggableRef.value?.$el
  if (!container) return
  
  container.scrollBy({
    left: 300,
    behavior: 'smooth'
  })
  
  // Check scroll buttons after scrolling
  setTimeout(checkScrollButtons, 300)
}

onMounted(() => {
  checkMobile();
  window.addEventListener('resize', checkMobile);
  
  // Add media query listener
  const mediaQuery = window.matchMedia('(max-width: 768px)');
  mediaQuery.addEventListener('change', checkMobile);
  
  const container = draggableRef.value?.$el;
  if (container) {
    container.addEventListener('scroll', checkScrollButtons);
    // Initial check after a short delay to ensure DOM is ready
    setTimeout(checkScrollButtons, 100);
  }
  
  // Clean up media query listener on unmount
  onUnmounted(() => {
    mediaQuery.removeEventListener('change', checkMobile);
  });
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile);
  const container = draggableRef.value?.$el;
  if (container) {
    container.removeEventListener('scroll', checkScrollButtons);
  }
});

const handleDragChange = (evt) => {
  if (evt.added) {
    const { element } = evt.added
    // Convert title to status format without replacing spaces with hyphens
    const newStatus = props.title.toLowerCase().split(' ').join('-')
    console.log('Task dragged to:', newStatus, 'Task:', element)
    
    // Get the task ID directly from the element
    const taskId = element.id
    console.log('Using task ID:', taskId)
    
    if (!taskId) {
      console.error('Could not find task ID in element:', element)
      return
    }
    
    // Emit the task-moved event for Firestore update
    emit('task-moved', taskId, newStatus)
  }
}
</script>

<style scoped>
.task-list {
  background: #1F1D2B;
  border-radius: 10px;
  padding: 16px;
  min-height: 500px;
  width: 100%;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  margin: 0;
  position: relative;
  height: 100%;
  cursor: pointer;
}

.task-list:hover {
  transform: scale(1.02);
  z-index: 1;
}

.task-list.today {
  z-index: 1;
  min-height: 550px;
  margin: 0;
  padding: 24px;
}

.task-list.today:hover {
  transform: scale(1.02);
  z-index: 2;
}

.task-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-shrink: 0;
}

.task-list-header h2 {
  margin: 0;
  font-size: 18px;
  color: #ffffff;
}

.task-count {
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: #ffffff;
  font-weight: 500;
  min-width: 24px;
  text-align: center;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.task-list-container {
  position: relative;
  width: 100%;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.scroll-button {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.7);
  border: none;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  z-index: 1;
  transition: all 0.2s ease;
  backdrop-filter: blur(4px);
  -webkit-tap-highlight-color: transparent;
  outline: none;
  user-select: none;
  -webkit-user-select: none;
  padding: 0;
}

.scroll-button i {
  font-size: 12px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.scroll-button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.9);
  color: #4CAF50;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.scroll-button:active:not(:disabled) {
  transform: translateY(-50%) scale(0.95);
}

.scroll-button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.scroll-left {
  left: 5px;
}

.scroll-right {
  right: 5px;
}

.task-list-content {
  flex: 1;
  overflow: visible;
  padding: 0;
  min-height: 200px;
  background: #1F1D2B;
  border-radius: 8px;
  transition: background-color 0.2s ease;
}

.task-list.is-today .task-list-content {
  overflow: visible;
}

.task-list:not(.is-today) .task-list-content {
  overflow: hidden;
}

.ghost-card {
  opacity: 0.5;
  background: #c8ebfb;
}

@media (max-width: 768px) {
  .task-list {
    width: 100%;
    min-height: auto;
  }

  .task-list-content {
    display: flex;
    flex-direction: row;
    gap: 16px;
    overflow-x: auto;
    padding-bottom: 16px;
    -webkit-overflow-scrolling: touch;
    scroll-behavior: smooth;
    padding-left: 8px;
    padding-right: 8px;
  }

  .task-list-content > * {
    flex: 0 0 270px;
  }
}

.task-list-header.not-today {
  opacity: 0.6;
}

.task-list-header.not-today h2,
.task-list-header.not-today .task-count {
  color: rgba(255, 255, 255, 0.7);
}

.task-list:hover .task-list-header.not-today {
  opacity: 1;
}

.task-list:hover .task-list-header.not-today h2,
.task-list:hover .task-list-header.not-today .task-count {
  color: #ffffff;
}

.day-title {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  line-height: 1.25;
}

.day-title h2 {
  margin: 0;
  font-size: 18px;
  color: #ffffff;
}

.day-date {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.task-list-header.not-today .day-date {
  color: rgba(255, 255, 255, 0.5);
}

.task-list:hover .task-list-header.not-today .day-date {
  color: rgba(255, 255, 255, 0.7);
}
</style> 