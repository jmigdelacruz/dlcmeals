<template>
  <div class="week-picker" v-if="isOpen" @click.stop>
    <div class="calendar">
      <div class="calendar-header">
        <button @click="previousMonth">
          <i class="fas fa-chevron-left"></i>
        </button>
        <span>{{ currentMonthYear }}</span>
        <button @click="nextMonth">
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
      <div class="calendar-grid">
        <div class="weekday-header" v-for="day in weekDays" :key="day">{{ day }}</div>
        <div 
          v-for="date in calendarDays" 
          :key="date.toISOString()"
          class="calendar-day"
          :class="{
            'other-month': !isCurrentMonth(date),
            'selected-week': isInSelectedWeek(date),
            'hovered-week': isInHoveredWeek(date),
            'today': isToday(date)
          }"
          @click="selectDate(date)"
          @mouseenter="hoveredDate = date"
          @mouseleave="hoveredDate = null"
        >
          {{ date.getDate() }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: [String, Date],
    default: ''
  },
  isOpen: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['update:modelValue', 'close'])

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const currentDate = ref(new Date(props.modelValue || new Date()))
const hoveredDate = ref(null)

const currentMonthYear = computed(() => {
  return currentDate.value.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
})

const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const days = []
  
  // Add days from previous month
  const firstDayWeekday = firstDay.getDay()
  const daysToAdd = firstDayWeekday === 0 ? 6 : firstDayWeekday - 1 // Adjust for Monday start
  for (let i = daysToAdd - 1; i >= 0; i--) {
    days.push(new Date(year, month, -i))
  }
  
  // Add days from current month
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(new Date(year, month, i))
  }
  
  // Add days from next month
  const remainingDays = 42 - days.length // 6 weeks * 7 days = 42
  for (let i = 1; i <= remainingDays; i++) {
    days.push(new Date(year, month + 1, i))
  }
  
  return days
})

const isCurrentMonth = (date) => {
  return date.getMonth() === currentDate.value.getMonth()
}

const isToday = (date) => {
  const today = new Date()
  return date.toDateString() === today.toDateString()
}

const isInSelectedWeek = (date) => {
  const selectedDate = new Date(props.modelValue)
  const selectedWeekStart = new Date(selectedDate)
  selectedWeekStart.setDate(selectedDate.getDate() - (selectedDate.getDay() || 7) + 1) // Adjust for Monday start
  const selectedWeekEnd = new Date(selectedWeekStart)
  selectedWeekEnd.setDate(selectedWeekStart.getDate() + 6)
  return date >= selectedWeekStart && date <= selectedWeekEnd
}

const isInHoveredWeek = (date) => {
  if (!hoveredDate.value) return false
  const hoveredWeekStart = new Date(hoveredDate.value)
  hoveredWeekStart.setDate(hoveredDate.value.getDate() - (hoveredDate.value.getDay() || 7) + 1) // Adjust for Monday start
  const hoveredWeekEnd = new Date(hoveredWeekStart)
  hoveredWeekEnd.setDate(hoveredWeekStart.getDate() + 6)
  return date >= hoveredWeekStart && date <= hoveredWeekEnd
}

const selectDate = (date) => {
  // Format the date as YYYY-MM-DD without timezone conversion
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const formattedDate = `${year}-${month}-${day}`
  emit('update:modelValue', formattedDate)
  emit('close')
}

const previousMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1)
}

const nextMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1)
}

// Close calendar when clicking outside
const handleClickOutside = (event) => {
  const weekPicker = event.target.closest('.week-picker')
  const dateInput = event.target.closest('.input-group')
  const calendarIcon = event.target.closest('.fa-calendar-alt')
  if (!weekPicker && !dateInput && !calendarIcon) {
    emit('close')
  }
}

// Add watch for isOpen prop
watch(() => props.isOpen, (newValue) => {
  if (newValue) {
    // Add event listener when calendar opens
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside)
    }, 0)
  } else {
    // Remove event listener when calendar closes
    document.removeEventListener('click', handleClickOutside)
  }
})

// Add watch for modelValue prop
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    currentDate.value = new Date(newValue)
  }
}, { immediate: true })
</script>

<style scoped>
.week-picker {
  position: absolute;
  top: 100%;
  left: 0;
  background: rgba(45, 48, 62, 0.95);
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 9999;
  padding: 12px;
  margin-top: 4px;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.calendar {
  width: 280px;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.calendar-header button {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.calendar-header button:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.1);
}

.calendar-header span {
  color: #ffffff;
  font-weight: 500;
  font-size: 14px;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.weekday-header {
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  font-size: 11px;
  padding: 2px;
}

.calendar-day {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
}

.calendar-day:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.calendar-day.other-month {
  color: rgba(255, 255, 255, 0.3);
}

.calendar-day.selected-week {
  background: rgba(234, 124, 105, 0.2);
  color: #EA7C69;
}

.calendar-day.hovered-week {
  background: rgba(234, 124, 105, 0.1);
  color: #EA7C69;
}

.calendar-day.today {
  color: #EA7C69;
  font-weight: 500;
}
</style> 