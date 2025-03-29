<template>
  <div class="task-card" :class="{ 'non-today': !isToday, 'behind-today': isBehindToday }" @click.stop="openTask">
    <template v-if="isToday">
      <div class="task-header">
        <h3 class="task-title">{{ task.title }}</h3>
      </div>
       
      <div class="task-content">
        <p class="description" v-html="truncatedDescription"></p>
        <div class="task-badges">
          <span class="meal-type-badge">{{ formatMealType(task.mealType) }}</span>
          <span v-if="task.calories" class="calories-badge">{{ task.calories }} kcal</span>
        </div>
      </div>
       
      <div class="task-image-container">
        <img v-if="task.images && task.images.length > 0" :src="task.images[0].url" :alt="task.title" class="task-image" />
      </div>
    </template>

    <template v-else>
      <div class="task-content">
        <div class="task-image-container" v-if="!isBehindToday">
          <img v-if="task.images && task.images.length > 0" :src="task.images[0].url" :alt="task.title" class="task-image" />
        </div>
        <div class="task-header">
          <h3 class="task-title">{{ task.title }}</h3>
        </div>
        <div class="task-badges">
          <span class="meal-type-badge">{{ formatMealType(task.mealType) }}</span>
          <span v-if="task.calories" class="calories-badge">{{ task.calories }} kcal</span>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, computed, defineAsyncComponent } from 'vue'

const OptimizedImage = defineAsyncComponent(() => 
  import('./OptimizedImage.vue')
)

const props = defineProps({
  task: {
    type: Object,
    required: true
  },
  isToday: {
    type: Boolean,
    default: false
  },
  isBehindToday: {
    type: Boolean,
    default: false
  },
  columnDate: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['open-task'])

const displayedImages = computed(() => {
  return props.task.images?.slice(0, 3) || []
})

const truncatedDescription = computed(() => {
  if (!props.task.description) return ''
  if (props.task.description.length <= 125) return props.task.description
  return props.task.description.substring(0, 125) + '<small><i> ... Read More</i></small>'
})

const openTask = () => {
  emit('open-task', props.task)
}

const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}

const formatStatus = (status) => {
  // Special case for 'todo' status
  if (status.toLowerCase() === 'todo') {
    return 'New'
  }
  
  return status.split('-').map(word => {
    // Special case for DLC
    if (word.toLowerCase() === 'dlc') {
      return 'DLC'
    }
    if (word.toLowerCase() === 'vb') {
      return 'VB'
    }
    return word.charAt(0).toUpperCase() + word.slice(1)
  }).join(' ')
}

const formatMealType = (type) => {
  if (!type) return 'Breakfast'
  return type.charAt(0).toUpperCase() + type.slice(1)
}
</script>

<style scoped>
.task-card {
  background: #2D303E;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  position: relative;
  padding-right: 16px;
}

.task-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.task-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 8px;
}

.task-header h3 {
  margin: 0;
  font-size: 14px;
  color: #ffffff;
  text-transform: uppercase;
}

.task-badges {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.task-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  text-transform: capitalize;
}

.task-badge.resolution {
  background: rgba(56, 142, 60, 0.2);
  color: #81c784;
}

.task-status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  text-transform: capitalize;
  font-weight: 500;
}

.task-status.new,
.task-status.todo {
  background: rgba(25, 118, 210, 0.2);
  color: #64b5f6;
}

.task-status.pending-vb,
.task-status.pending-dlc {
  background: rgba(245, 124, 0, 0.2);
  color: #ffb74d;
}

.task-status.resolved {
  background: rgba(56, 142, 60, 0.2);
  color: #81c784;
}

.task-content {
  margin: 8px 0 0 0;
  width: calc(100% - 60px);
}

.meal-type-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  text-transform: capitalize;
  font-weight: 500;
  background: rgba(234, 124, 105, 0.2);
  color: #EA7C69;
  margin: 8px 0;
}

.calories-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  text-transform: capitalize;
  font-weight: 500;
  background: rgba(234, 124, 105, 0.2);
  color: #EA7C69;
  margin-right: 8px;
}

.description {
  margin: 8px 0;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.3;
}

.task-images {
  margin: 8px 0;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
}

.image-preview {
  position: relative;
  aspect-ratio: 1;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease;
  background: transparent;
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: transparent;
}

.image-number {
  position: absolute;
  bottom: 2px;
  left: 2px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 2px 4px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 500;
}

.task-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.task-comments,
.task-images-count,
.task-date {
  display: flex;
  align-items: center;
  gap: 4px;
}

.task-comments i,
.task-images-count i,
.task-date i {
  color: #EA7C69;
}

.more-images {
  background: #1F1D2B;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.more-images-overlay {
  background: rgba(0, 0, 0, 0.5);
  color: white;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 500;
}

.resolution-badge {
  background: rgba(56, 142, 60, 0.2);
  color: #81c784;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
  margin: 8px 0;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  word-wrap: break-word;
}

.resolution-badge i {
  font-size: 14px;
  flex-shrink: 0;
}

.resolution-badge span {
  flex: 1;
  min-width: 0;
  word-wrap: break-word;
}

.task-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  background-color: #2D303E;
}

.task-image-container {
  position: absolute;
  right: -15%;
  top: 0;
  bottom: 0;
  width: 120px;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
  background-color: #2D303E;
  display: flex;
  align-items: center;
  justify-content: center;
}

.non-today {
  text-align: left;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  padding-right: 16px;
  overflow: hidden;
  position: relative;
}

.non-today .task-content {
  margin: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}

.non-today .description {
  display: none;
}

.non-today .task-header {
  align-items: flex-start;
  margin: 0;
}

.non-today .task-title {
  font-size: 14px;
  margin: 0;
  text-transform: uppercase;
}

.non-today .task-badges {
  justify-content: flex-start;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.non-today .task-image {
  width: 50px;
  height: 50px;
}

.non-today .task-image-container {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  width: 50px;
  height: 50px;
}

.non-today .meal-type-badge,
.non-today .calories-badge {
  margin: 0;
}

@media (max-width: 768px) {
  .task-card {
    padding: 16px;
  }
  
  .task-content {
    width: 100%;
  }
  
  .task-image-container {
    position: static;
    transform: none;
    width: 100px;
    height: 100px;
    right: 0;
  }

  .non-today .task-image {
    width: 50px;
    height: 50px;
  }

  .non-today .task-image-container {
    position: absolute;
    right: 16px;
    top: 50%;
    transform: translateY(-50%);
    width: 50px;
    height: 50px;
  }
}

@media (max-width: 480px) {
  .task-image-container {
    width: 80px;
    height: 80px;
  }

  .non-today .task-image {
    width: 40px;
    height: 40px;
  }

  .non-today .task-image-container {
    width: 40px;
    height: 40px;
    right: 12px;
  }

  .non-today {
    padding: 12px;
    gap: 8px;
  }
}

.task-card.behind-today .task-content {
  text-align: center;
  align-items: center;
}

.task-card.behind-today .task-header {
  text-align: center;
}

.task-card.behind-today .task-badges {
  justify-content: center;
}

.task-card.behind-today .task-title {
  text-align: center;
}

.task-card.behind-today .description {
  text-align: center;
}

.task-card.behind-today .meal-type-badge,
.task-card.behind-today .calories-badge {
  text-align: center;
}
</style>
