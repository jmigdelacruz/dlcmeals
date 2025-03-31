<template>
  <div class="task-list" :class="{ 'today': isToday, 'behind-today': isBehindToday }" :style="{ flex: columnWidth }" @animationend="$emit('animationend')" @click="handleColumnClick">
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
        @click.stop="scrollLeft"
        :disabled="!canScrollLeft"
      >
        <i class="fas fa-chevron-left"></i>
      </button>
      <draggable
        ref="draggableRef"
        :list="tasks"
        @update:list="$emit('update:tasks', $event)"
        group="tasks"
        item-key="id"
        class="task-list-content"
        :animation="150"
        ghost-class="ghost-card"
        :direction="isMobile ? 'vertical' : 'horizontal'"
        @change="handleDragChange"
        @start="isDragging = true"
        @end="isDragging = false"
        drag-class="dragging-card"
        @click.stop
      >
        <template #item="{ element }">
          <TaskCard
            :task="element"
            :isToday="isToday"
            :isBehindToday="isBehindToday"
            :columnDate="getColumnDate(title)"
            @open-task="$emit('open-task', element)"
            @click.stop
          />
        </template>
      </draggable>
      <div class="task-list-footer">
        <div v-if="hasDayDetails" class="day-details">
          <span v-if="weight" class="weight-value">
            <i class="fas fa-weight"></i> {{ weight }} kg
          </span>
          <span v-if="cardio" class="cardio-value">
            <i class="fas fa-running"></i> {{ cardio }} min
          </span>
        </div>
        <div v-else class="day-details-placeholder">
          Click to add day details
        </div>
      </div>
      <button 
        v-if="isMobile" 
        class="scroll-button scroll-right" 
        @click.stop="scrollRight"
        :disabled="!canScrollRight"
      >
        <i class="fas fa-chevron-right"></i>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted, defineAsyncComponent, watch } from 'vue'
import draggable from 'vuedraggable/src/vuedraggable'

// Lazy load both TaskCard and draggable
const TaskCard = defineAsyncComponent(() => 
  import('./TaskCard.vue')
)

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  tasks: {
    type: Array,
    required: true
  },
  selectedWeekStart: {
    type: Date,
    required: true
  },
  weight: {
    type: Number,
    default: null
  },
  cardio: {
    type: Number,
    default: null
  }
})

const emit = defineEmits(['update:tasks', 'task-moved', 'open-task', 'animationend', 'column-click'])
const isMobile = ref(false)
const draggableRef = ref(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)
const isDragging = ref(false)

const dayMap = {
  'monday': 0,
  'tuesday': 1,
  'wednesday': 2,
  'thursday': 3,
  'friday': 4,
  'saturday': 5,
  'sunday': 6
}

const isToday = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const columnDate = new Date(props.selectedWeekStart)
  columnDate.setDate(columnDate.getDate() + dayMap[props.title.toLowerCase()])
  columnDate.setHours(0, 0, 0, 0)
  
  return columnDate.getTime() === today.getTime()
})

const columnWidth = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const columnDate = new Date(props.selectedWeekStart)
  columnDate.setDate(columnDate.getDate() + dayMap[props.title.toLowerCase()])
  columnDate.setHours(0, 0, 0, 0)
  
  const distance = columnDate.getTime() - today.getTime()
  const daysDiff = Math.round(distance / (1000 * 60 * 60 * 24))
  
  // Today's column gets 1.6, the next day gets 1.3, others get progressively smaller
  if (daysDiff === 0) return 1.6
  if (daysDiff === 1) return 1.3
  if (daysDiff === 2) return 0.6
  if (daysDiff === 3) return 0.6
  return 0.6
})

const formattedTitle = computed(() => {
  return props.title.slice(0, 3).toUpperCase()
})

const totalCalories = computed(() => {
  return props.tasks.reduce((sum, task) => sum + (task.calories || 0), 0)
})

const isBehindToday = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const columnDate = new Date(props.selectedWeekStart)
  columnDate.setDate(columnDate.getDate() + dayMap[props.title.toLowerCase()])
  columnDate.setHours(0, 0, 0, 0)
  
  // Get the selected week's Monday
  const weekStart = new Date(props.selectedWeekStart)
  weekStart.setHours(0, 0, 0, 0)
  
  // Get the selected week's Sunday
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)
  
  // Check if this column's date is within the selected week and behind today
  return columnDate >= weekStart && 
         columnDate <= weekEnd && 
         columnDate < today
})

const formatDayDate = (day) => {
  const dayIndex = dayMap[day.toLowerCase()]
  const targetDate = new Date(props.selectedWeekStart)
  targetDate.setDate(targetDate.getDate() + dayIndex)
  return targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const getColumnDate = (day) => {
  const dayIndex = dayMap[day.toLowerCase()]
  const targetDate = new Date(props.selectedWeekStart)
  targetDate.setDate(targetDate.getDate() + dayIndex)
  return targetDate.toISOString().split('T')[0]
}

const handleDragChange = (evt) => {
  if (evt.added) {
    emit('task-moved', {
      taskId: evt.added.element.id,
      fromDate: evt.added.from.getAttribute('data-date'),
      toDate: evt.added.to.getAttribute('data-date')
    })
  }
}

const checkScrollButtons = () => {
  if (!draggableRef.value) return
  
  const container = draggableRef.value.$el
  canScrollLeft.value = container.scrollLeft > 0
  canScrollRight.value = container.scrollLeft < (container.scrollWidth - container.clientWidth)
}

const scrollLeft = () => {
  if (!draggableRef.value) return
  draggableRef.value.$el.scrollBy({ left: -200, behavior: 'smooth' })
}

const scrollRight = () => {
  if (!draggableRef.value) return
  draggableRef.value.$el.scrollBy({ left: 200, behavior: 'smooth' })
}

const handleColumnClick = (event) => {
  // Don't emit if clicking on a task card or scroll button
  if (event.target.closest('.task-card') || event.target.closest('.scroll-button')) {
    return
  }
  console.log('TaskList: Column clicked, emitting date:', getColumnDate(props.title))
  emit('column-click', getColumnDate(props.title))
}

const hasDayDetails = computed(() => {
  return props.weight !== null || props.cardio !== null
})

onMounted(() => {
  isMobile.value = window.innerWidth < 768
  window.addEventListener('resize', () => {
    isMobile.value = window.innerWidth < 768
  })
  
  if (isMobile.value) {
    const container = draggableRef.value.$el
    container.addEventListener('scroll', checkScrollButtons)
    checkScrollButtons()
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', () => {
    isMobile.value = window.innerWidth < 768
  })
  
  if (isMobile.value && draggableRef.value) {
    draggableRef.value.$el.removeEventListener('scroll', checkScrollButtons)
  }
})

// Watch for changes in tasks prop
watch(() => props.tasks, (newTasks) => {
  // Handle the update
}, { deep: true })
</script>

<style scoped>
.task-list {
  background: #1F1D2B;
  border-radius: 10px;
  padding: 16px;
  min-height: 550px;
  width: 100%;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  margin: 0;
  position: relative;
  height: 100%;
  cursor: pointer;
  transform-origin: center;
}

.task-list:hover {
  transform: scale(1.02);
  z-index: 1;
}

.task-list.today {
  z-index: 1;
  min-height: 600px;
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
  margin-bottom: 0px;
  flex-shrink: 0;
}

.task-list-header h2 {
  margin: 0;
  font-size: 18px;
  color: #ffffff;
}

.task-count {
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
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
  cursor: pointer;
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
  position: relative;
  z-index: 1;
  cursor: pointer;
  border-bottom-right-radius: 0;
  border-bottom-left-radius: 0;
}


.task-list.is-today .task-list-content {
  overflow: visible;
}

.task-list:not(.is-today) .task-list-content {
  overflow: hidden;
}

/* Simple ghost card style */
.ghost-card {
  background: #2D303E;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  opacity: 0.5;
  pointer-events: none;
}

.ghost-card * {
  display: none !important;
}

.dragging-card {
  opacity: 0.5;
  background: #c8ebfb;
  pointer-events: none;
  cursor: grabbing;
  transform: scale(1.05);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.ghost-card .task-image-container {
  display: none;
}

.ghost-card .task-content {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  padding: 8px;
  margin: 8px 0;
}

.ghost-card .task-header,
.ghost-card .task-badges {
  opacity: 0.7;
}

.ghost-card .description {
  display: none;
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
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #ffffff;
  padding: 0 0 0.5rem 0;
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.day-title:hover {
  transform: translateY(-2px);
  color: #EA7C69;
}

.day-title::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 2px;
  background: #EA7C69;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.day-title:hover::after {
  width: 100%;
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

/* .behind-today {
  opacity: 0.7;
  background-color: rgba(0, 0, 0, 0.2);
}

.behind-today .task-list-header {
  color: rgba(255, 255, 255, 0.5);
}

.behind-today .task-card {
  background-color: rgba(0, 0, 0, 0.1);
} */

.empty-space {
  min-height: 200px;
  width: 100%;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.empty-space:hover {
  background-color: #2D303E;
}

.task-list-footer {
  padding: 0.75rem;
  background-color: #2D303E;
  border-radius: 0 0 8px 8px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  text-align: center;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
}

.task-list-footer:hover {
  background-color: #3D404E;
  color: #ffffff;
}

.day-details {
  display: flex;
  gap: 1rem;
  justify-content: center;
  align-items: center;
}

.weight-value, .cardio-value {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}

.weight-value i {
  color: #EA7C69;
}

.cardio-value i {
  color: #4CAF50;
}

.day-details-placeholder {
  color: rgba(255, 255, 255, 0.5);
  font-style: italic;
}
</style> 