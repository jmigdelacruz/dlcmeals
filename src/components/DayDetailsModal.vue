<template>
  <Teleport to="body">
    <div v-if="isOpen" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <h2>Day Details</h2>
        <small>{{ date }}</small>
        <div class="form-group">
          <label for="weight">Weight (kg):</label>
          <input
            type="number"
            id="weight"
            v-model="weight"
            step="0.1"
            min="0"
            class="form-control"
          />
        </div>
        <div class="form-group">
          <label for="cardio">Cardio (minutes):</label>
          <input
            type="number"
            id="cardio"
            v-model="cardio"
            min="0"
            class="form-control"
          />
        </div>
        <div class="modal-actions">
          <button @click="saveDetails" class="btn btn-primary">Save</button>
          <button @click="closeModal" class="btn btn-secondary">Cancel</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  existingWeight: {
    type: Number,
    default: null
  },
  existingCardio: {
    type: Number,
    default: null
  }
})

// Add watcher for isOpen prop
watch(() => props.isOpen, (newValue) => {
  console.log('DayDetailsModal: isOpen prop changed:', newValue)
})

const emit = defineEmits(['close', 'save'])

const weight = ref(props.existingWeight || '')
const cardio = ref(props.existingCardio || '')

// Watch for changes in existingWeight prop
watch(() => props.existingWeight, (newValue) => {
  console.log('DayDetailsModal: existingWeight changed:', newValue)
  weight.value = newValue || ''
})

// Watch for changes in existingCardio prop
watch(() => props.existingCardio, (newValue) => {
  console.log('DayDetailsModal: existingCardio changed:', newValue)
  cardio.value = newValue || ''
})

const closeModal = () => {
  console.log('DayDetailsModal: Closing modal')
  weight.value = ''
  cardio.value = ''
  emit('close')
}

const saveDetails = () => {
  console.log('DayDetailsModal: Saving details:', { weight: weight.value, cardio: cardio.value })
  emit('save', {
    date: props.date,
    weight: weight.value ? parseFloat(weight.value) : null,
    cardio: cardio.value ? parseInt(cardio.value) : null
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
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: #1F1D2B;
  padding: 2rem;
  border-radius: 10px;
  width: 90%;
  max-width: 500px;
  position: relative;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.modal-content h2 {
  margin: 0;
  color: #ffffff;
  font-size: 1.5rem;
  font-weight: 600;
}

.modal-content small {
  display: block;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #ffffff;
  font-weight: 500;
}

.form-control {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  background-color: #2D303E;
  color: #ffffff;
  font-size: 1rem;
  transition: border-color 0.2s ease;
}

.form-control:focus {
  outline: none;
  border-color: #EA7C69;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background-color: #EA7C69;
  color: #ffffff;
}

.btn-primary:hover {
  background-color: #d86b57;
}

.btn-secondary {
  background-color: #2D303E;
  color: #ffffff;
}

.btn-secondary:hover {
  background-color: #3D414E;
}
</style> 