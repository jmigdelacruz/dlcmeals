<template>
  <div class="task-list" :class="{ today: isToday }" :style="{ flex: columnWidth }" @animationend="$emit('animationend')">
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
        @update:list="$emit('update:tasks', $event)"
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
  }
})

const emit = defineEmits(['update:tasks', 'task-moved', 'open-task', 'animationend'])
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

const formattedTitle = computed(() => {
  return props.title.slice(0, 3).toUpperCase()
})

const totalCalories = computed(() => {
  return props.tasks.reduce((sum, task) => sum + (task.calories || 0), 0)
})

const isBehindToday = computed(() => {
  const today = new Date().getDay()
  const currentDay = dayMap[props.title.toLowerCase()]
  const distance = currentDay - today
  
  // If it's the next day (including Sunday when today is Saturday), it's not behind today
  if (distance === 1 || distance === -6) return false
  
  // For all other days, check if they're before today
  return currentDay < today
})

const formatDayDate = (day) => {
  const today = new Date()
  const dayIndex = dayMap[day.toLowerCase()]
  const targetDate = new Date(today)
  targetDate.setDate(today.getDate() + (dayIndex - today.getDay()))
  return targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const getColumnDate = (day) => {
  const today = new Date()
  const dayIndex = dayMap[day.toLowerCase()]
  const targetDate = new Date(today)
  targetDate.setDate(today.getDate() + (dayIndex - today.getDay()))
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
  transform-origin: center;
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
</style> 