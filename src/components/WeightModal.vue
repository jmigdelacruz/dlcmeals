<template>
  <div v-if="isOpen" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>Add Weight for {{ formatDate(date) }}</h2>
        <button class="close-button" @click="closeModal">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <form @submit.prevent="handleSubmit" class="modal-body">
        <div class="form-group">
          <label for="weight">Weight (kg)</label>
          <div class="weight-input">
            <input
              type="number"
              id="weight"
              v-model="weightValue"
              class="form-control"
              placeholder="Enter weight"
              min="0"
              step="0.1"
            >
            <span class="weight-unit">kg</span>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="cancel-button" @click="closeModal">Cancel</button>
          <button type="submit" class="save-button">Save Weight</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  initialWeight: {
    type: Number,
    default: null
  }
})

const emit = defineEmits(['close', 'save'])

const weightValue = ref(props.initialWeight || '')

const handleSubmit = () => {
  if (weightValue.value !== '') {
    emit('save', {
      date: props.date,
      weight: parseFloat(weightValue.value)
    })
    closeModal()
  }
}

const closeModal = () => {
  emit('close')
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: #1F1D2B;
  border-radius: 8px;
  width: 90%;
  max-width: 400px;
  color: #ffffff;
}

.modal-header {
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  font-size: 18px;
  color: #ffffff;
}

.close-button {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.7);
  padding: 4px;
}

.modal-body {
  padding: 16px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 13px;
  font-weight: 500;
}

.weight-input {
  position: relative;
  width: 100%;
}

.weight-input .form-control {
  width: 100%;
  padding: 8px;
  padding-right: 40px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  background: #2D303E;
  color: #ffffff;
  font-family: inherit;
}

.weight-unit {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
}

.modal-footer {
  padding: 16px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.cancel-button,
.save-button {
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  min-width: 100px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cancel-button {
  background: #2D303E;
  border: none;
  color: rgba(255, 255, 255, 0.7);
}

.cancel-button:hover {
  background: rgba(255, 255, 255, 0.05);
}

.save-button {
  background: #EA7C69;
  border: none;
  color: white;
}

.save-button:hover {
  background: #d86b57;
}
</style> 