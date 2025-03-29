<template>
  <div v-if="isOpen" class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>{{ modalTitle }}</h2>
        <div class="modal-actions">
          <button v-if="task" class="delete-button" @click="handleDelete">
            <i class="fas fa-trash"></i>
          </button>
          <button class="close-button" @click="closeModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
      
      <form @submit.prevent="handleSubmit" class="modal-body">
        <div class="form-group">
          <label for="title">Title</label>
          <div class="title-row">
            <input
              type="text"
              id="title"
              v-model="form.title"
              class="form-control"
              placeholder="Enter meal title"
            >
            <div class="calories-input">
              <input
                type="number"
                id="calories"
                v-model="caloriesValue"
                class="form-control"
                placeholder="Calories"
                min="0"
              >
              <span class="calories-unit">kcal</span>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label for="description">Description</label>
          <textarea
            id="description"
            v-model="form.description"
            rows="3"
            placeholder="Enter meal description"
          ></textarea>
        </div>

        <div class="form-group">
          <label>Meal Type</label>
          <div class="meal-type-options">
            <div class="radio-label">
              <input
                type="radio"
                v-model="form.mealType"
                value="breakfast"
                name="mealType"
                id="breakfast"
              >
              <label for="breakfast">Breakfast</label>
            </div>
            <div class="radio-label">
              <input
                type="radio"
                v-model="form.mealType"
                value="lunch"
                name="mealType"
                id="lunch"
              >
              <label for="lunch">Lunch</label>
            </div>
            <div class="radio-label">
              <input
                type="radio"
                v-model="form.mealType"
                value="dinner"
                name="mealType"
                id="dinner"
              >
              <label for="dinner">Dinner</label>
            </div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="mealDate">Meal Date</label>
            <div class="input-group">
              <input 
                type="date" 
                id="mealDate" 
                v-model="form.mealDate" 
                class="form-control"
                @change="updateDayFromDate"
                ref="dateInput"
                @click="() => {
                  showDatePicker = true;
                }"
              >
              <i class="fas fa-calendar-alt" @click="() => {
                showDatePicker = true;
              }"></i>
            </div>
            <div class="week-picker-container">
              <WeekPicker
                v-if="showDatePicker"
                v-model="form.mealDate"
                :is-open="showDatePicker"
                @close="() => {
                  showDatePicker = false;
                }"
                @update:modelValue="(value) => {
                  updateDayFromDate();
                }"
              />
            </div>
          </div>

          <div class="form-group">
            <label for="status">Day</label>
            <select id="status" v-model="form.status" class="form-control" disabled>
              <option value="monday">Monday</option>
              <option value="tuesday">Tuesday</option>
              <option value="wednesday">Wednesday</option>
              <option value="thursday">Thursday</option>
              <option value="friday">Friday</option>
              <option value="saturday">Saturday</option>
              <option value="sunday">Sunday</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label for="viewType">View</label>
          <select id="viewType" v-model="form.viewType" class="form-control">
            <option value="daddy">Daddy</option>
            <option value="family">Family</option>
          </select>
        </div>

        <div class="form-group">
          <label for="images">Meal Image</label>
          <div class="image-upload-container">
            <div class="image-preview-grid">
              <div v-if="form.images.length > 0" class="image-preview" @click="openImageModal(form.images[0])">
                <img :src="form.images[0].url" alt="Meal image">
                <button type="button" class="delete-image" @click.stop="handleImageDelete(0)">×</button>
              </div>
              <div class="image-upload-input">
                <input
                  id="images"
                  type="file"
                  accept="image/*"
                  @change="handleImageUpload"
                  :disabled="form.images.length > 0"
                >
                <label for="images" class="upload-label">
                  <div class="upload-icon">
                    <i class="fas fa-cloud-upload-alt"></i>
                  </div>
                  <span class="upload-text">{{ form.images.length > 0 ? 'Change Image' : 'Upload Image' }}</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div class="comments-section">
          <h3>Comments</h3>
          <div class="comments-list">
            <div v-for="(comment, index) in form.comments" :key="index" class="comment">
              <div class="comment-header">
                <span class="comment-author">{{ comment.author }}</span>
                <span class="comment-date">{{ formatDate(comment.date) }}</span>
              </div>
              <div v-if="editingCommentIndex === index" class="comment-edit-form">
                <textarea
                  v-model="editingCommentText"
                  rows="6"
                  class="comment-edit-input"
                  @keyup.enter.ctrl="saveCommentEdit(index)"
                ></textarea>
                <div class="comment-edit-actions">
                  <button type="button" class="save-edit-btn" @click="saveCommentEdit(index)">Save</button>
                  <button type="button" class="cancel-edit-btn" @click="cancelCommentEdit">Cancel</button>
                </div>
              </div>
              <p v-else class="comment-text" @click="startCommentEdit(index)">{{ comment.text }}</p>
              <div class="comment-actions">
                <button type="button" class="edit-comment" @click="startCommentEdit(index)" title="Edit comment">
                  <i class="fas fa-edit"></i>
                </button>
                <button type="button" class="delete-comment" @click="deleteComment(index)">×</button>
              </div>
            </div>
          </div>
          <div class="add-comment">
            <div class="comment-input-group">
              <input
                v-model="newCommentAuthor"
                type="text"
                placeholder="Your name"
                class="comment-author-input"
              >
              <textarea
                v-model="newComment"
                rows="2"
                placeholder="Add a comment..."
                @keyup.enter="addComment"
              ></textarea>
            </div>
            <button 
              type="button" 
              @click="addComment" 
              class="add-comment-button"
              :disabled="!newComment.trim() || !newCommentAuthor.trim()"
            >Add</button>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="cancel-button" @click="closeModal">Cancel</button>
          <button type="submit" class="save-button">Save Meal</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Image Enlargement Modal -->
  <div v-if="showImageModal" class="modal-overlay" @click="closeImageModal">
    <div class="image-modal-content" @click.stop>
      <div class="image-modal-header">
        <button class="close-button" @click="closeImageModal">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="image-modal-body">
        <OptimizedImage
          :src="selectedImage?.url"
          :alt="'Enlarged image'"
          :width="800"
          :height="600"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import imageCompression from 'browser-image-compression'
import { uploadImage, deleteImage } from '../services/firebaseService'
import OptimizedImage from './OptimizedImage.vue'
import WeekPicker from './WeekPicker.vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  task: {
    type: Object,
    default: null
  },
  activeView: {
    type: String,
    default: 'daddy'
  },
  modalTitle: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['close', 'save', 'delete'])

// Initialize form with default values
const defaultFormState = {
  title: '',
  description: '',
  mealDate: '',
  mealType: 'breakfast',
  status: 'monday',
  comments: [],
  images: [],
  calories: null,
  viewType: 'daddy'
}

const form = ref({ ...defaultFormState })
const showDatePicker = ref(false)

const newComment = ref('')
const newCommentAuthor = ref('')

const isEditing = computed(() => {
  const result = !!props.task
  return result
})

const showImageModal = ref(false)
const selectedImage = ref(null)

const editingCommentIndex = ref(-1)
const editingCommentText = ref('')

const caloriesValue = computed({
  get: () => form.value.calories,
  set: (value) => {
    // If the value is empty, set to null
    if (value === '') {
      form.value.calories = null
    } else {
      // Convert to number and store
      form.value.calories = Number(value)
    }
  }
})

const resetForm = () => {
  form.value = {
    ...defaultFormState,
    viewType: props.activeView,
    mealDate: ''
  }
  newComment.value = ''
  newCommentAuthor.value = ''
}

const updateDayFromDate = () => {
  if (!form.value.mealDate) return
  
  const date = new Date(form.value.mealDate)
  const day = date.getDay()
  const dayMap = {
    0: 'sunday',
    1: 'monday',
    2: 'tuesday',
    3: 'wednesday',
    4: 'thursday',
    5: 'friday',
    6: 'saturday'
  }
  
  form.value.status = dayMap[day]
}

// Watch for changes in the task prop
watch(() => props.task, (newTask) => {
  if (newTask) {
    let formattedMealDate = ''
    if (newTask.mealDate) {
      const date = new Date(newTask.mealDate)
      formattedMealDate = date.toISOString().split('T')[0]
    }
    
    form.value = {
      ...defaultFormState,
      ...newTask,
      viewType: newTask.viewType || props.activeView,
      mealDate: formattedMealDate,
      calories: newTask.calories || null,
      comments: newTask.comments || [],
      images: newTask.images || []
    }
    if (newTask.mealDate) {
      updateDayFromDate()
    }
  } else {
    resetForm()
  }
}, { immediate: true })

// Watch for changes in activeView
watch(() => props.activeView, (newView) => {
  if (!props.task) {
    form.value.viewType = newView
  }
}, { immediate: true })

// Add a watch for modalTitle
watch(() => props.modalTitle, (newTitle) => {
}, { immediate: true })

const closeModal = () => {
  emit('close')
  resetForm()
}

const handleSubmit = async () => {
  try {
    // Create a copy of the form data
    const taskData = { ...form.value }
    
    // Convert calories to number if it exists and has a value
    if (taskData.calories !== null && taskData.calories !== '') {
      taskData.calories = parseInt(taskData.calories)
    } else {
      delete taskData.calories
    }
    
    // Handle mealDate field - only delete if it's empty string
    if (taskData.mealDate === '') {
      delete taskData.mealDate
    }
    
    // If it's a new task, we don't need to include the id
    if (!isEditing.value) {
      delete taskData.id
    }
    
    // Emit the save event with the task data
    await emit('save', taskData)
    closeModal()
  } catch (error) {
    alert('Failed to save task. Please try again.')
  }
}

const addComment = () => {
  if (newComment.value.trim() && newCommentAuthor.value.trim()) {
    form.value.comments.push({
      text: newComment.value.trim(),
      author: newCommentAuthor.value.trim(),
      date: new Date().toISOString()
    })
    newComment.value = ''
    newCommentAuthor.value = ''
  }
}

const deleteComment = (index) => {
  form.value.comments.splice(index, 1)
}

const handleImageDelete = async (index) => {
  const image = form.value.images[index]
  try {
    // Delete from Firebase Storage using the full URL
    await deleteImage(image.url)
    // Remove from form
    form.value.images.splice(index, 1)
    // Only save the task if we're editing an existing task
    if (isEditing.value && props.task?.id) {
      try {
        await emit('save', { ...form.value })
      } catch (error) {
        // Don't show alert here as the image was deleted successfully
      }
    }
  } catch (error) {
    alert('Failed to delete image. Please try again.')
  }
}

const handleImageUpload = async (event) => {
  const files = event.target.files
  if (!files || files.length === 0) return

  const file = files[0]
  if (file.type.startsWith('image/')) {
    try {
      // Delete existing image if any
      if (form.value.images.length > 0) {
        await handleImageDelete(0)
      }

      if (file.type === 'image/png') {
        const imageData = await uploadImage(file)
        form.value.images = [imageData]
      } else {
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          format: 'image/png'
        }
        const compressedFile = await imageCompression(file, options)
        const imageData = await uploadImage(compressedFile)
        form.value.images = [imageData]
      }
      
      // Only save the task if we're editing an existing task
      if (isEditing.value && props.task?.id) {
        try {
          await emit('save', { ...form.value })
        } catch (error) {
          // Don't show alert here as the image was uploaded successfully
        }
      }
    } catch (error) {
      alert('Failed to upload image. Please try again.')
    }
  }
}

const formatDate = (date) => {
  return new Date(date).toLocaleString()
}

const handleDelete = () => {
  const confirmation = prompt('Type "delete" to confirm task deletion:')
  if (confirmation?.toLowerCase() === 'delete') {
    emit('delete', props.task.id)
    closeModal()
  }
}

const openImageModal = (image) => {
  selectedImage.value = image
  showImageModal.value = true
}

const closeImageModal = () => {
  showImageModal.value = false
  selectedImage.value = null
}

const startCommentEdit = (index) => {
  editingCommentIndex.value = index
  editingCommentText.value = form.value.comments[index].text
}

const saveCommentEdit = (index) => {
  if (editingCommentText.value.trim()) {
    form.value.comments[index] = {
      ...form.value.comments[index],
      text: editingCommentText.value.trim(),
      date: new Date().toISOString()
    }
    editingCommentIndex.value = -1
    editingCommentText.value = ''
  }
}

const cancelCommentEdit = () => {
  editingCommentIndex.value = -1
  editingCommentText.value = ''
}

const handleOverlayClick = (event) => {
  // If the click is on the overlay and not on the calendar or its trigger elements
  const isCalendarClick = event.target.closest('.week-picker') || 
                         event.target.closest('.input-group') ||
                         event.target.closest('.fa-calendar-alt')
  
  if (!isCalendarClick) {
    showDatePicker.value = false
    closeModal()
  }
}
</script>

<style scoped>
:root {
  --theme-orange: #EA7C69;
}

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
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
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

.modal-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.delete-button {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #EA7C69;
  padding: 4px;
}

.delete-button:hover {
  color: #d86b57;
}

.close-button {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.7);
  padding: 4px;
  margin-right: 4px;
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

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 8px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  background: #2D303E;
  color: #ffffff;
  font-family: inherit;
}

.form-group input::placeholder,
.form-group select::placeholder,
.form-group textarea::placeholder {
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
  font-family: inherit;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--theme-orange);
}

.comments-section {
  margin-top: 24px;
}

.comments-section h3 {
  margin-bottom: 16px;
  color: #ffffff;
}

.comments-list {
  margin-bottom: 16px;
}

.comment {
  background: #2D303E;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 8px;
  position: relative;
  border: none;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  padding-right: 100px;
}

.comment-author {
  font-weight: 500;
  color: #ffffff;
}

.comment-date {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.comment-text {
  margin: 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  padding-right: 24px;
  white-space: pre-line;
  cursor: pointer;
}

.comment-edit-form {
  margin-top: 8px;
}

.comment-edit-input {
  width: 100%;
  padding: 8px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  resize: vertical;
  min-height: 60px;
  margin-bottom: 8px;
  background: #2D303E;
  color: #ffffff;
}

.comment-edit-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.save-edit-btn,
.cancel-edit-btn {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  border: none;
}

.save-edit-btn {
  background-color: #EA7C69;
  color: white;
}

.save-edit-btn:hover {
  background-color: #d86b57;
}

.cancel-edit-btn {
  background-color: #1F1D2B;
  color: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.cancel-edit-btn:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.comment-actions {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  gap: 8px;
  z-index: 1;
}

.edit-comment {
  background: none;
  border: none;
  color: #EA7C69;
  cursor: pointer;
  font-size: 16px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.edit-comment:hover {
  background-color: rgba(234, 124, 105, 0.1);
}

.delete-comment {
  position: static;
  background: none;
  border: none;
  color: #EA7C69;
  cursor: pointer;
  font-size: 18px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
  flex-shrink: 0;
}

.delete-comment:hover {
  background-color: rgba(234, 124, 105, 0.1);
}

.add-comment {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.comment-input-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.comment-author-input {
  padding: 8px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  background: #2D303E;
  color: #ffffff;
}

.add-comment textarea {
  padding: 8px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  resize: vertical;
  min-height: 60px;
  background: #2D303E;
  color: #ffffff;
}

.add-comment-button {
  padding: 8px 16px;
  background: #EA7C69;
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;
  font-size: 14px;
  align-self: flex-start;
}

.add-comment-button:hover {
  background: #d86b57;
}

.add-comment-button:disabled {
  background: rgba(255, 255, 255, 0.1);
  cursor: not-allowed;
}

.modal-footer {
  padding: 16px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-left: auto;
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

.image-upload-container {
  margin-top: 8px;
}

.image-preview-grid {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  align-items: flex-start;
}

.image-preview {
  position: relative;
  width: 180px;
  height: 180px;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: transparent;
}

.image-preview:hover {
  transform: scale(1.05);
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: transparent;
}

.delete-image {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.5);
  border: none;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  z-index: 2;
  transition: background-color 0.2s ease;
}

.delete-image:hover {
  background: rgba(0, 0, 0, 0.7);
}

.image-upload-input {
  flex: 1;
  position: relative;
  display: flex;
  align-items: flex-start;
}

.image-upload-input input[type="file"] {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

.upload-label {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #2D303E;
  border: 1px dashed #EA7C69;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: rgba(255, 255, 255, 0.7);
  white-space: nowrap;
  height: 36px;
  width: 100%;
  margin-top: 0;
}

.upload-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.upload-icon i {
  font-size: 18px;
  color: #EA7C69;
}

.upload-text {
  font-size: 14px;
  font-weight: 500;
  display: inline-block;
  padding-left: 8px;
}

.upload-label:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: var(--theme-orange);
  color: #ffffff;
}

.form-row {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.form-row .form-group {
  flex: 1;
  margin-bottom: 0;
}

.image-modal-content {
  background: rgba(0, 0, 0, 0.9);
  border-radius: 8px;
  width: 90%;
  max-width: 90vw;
  max-height: 90vh;
  overflow: hidden;
  position: relative;
}

.image-modal-header {
  padding: 12px 16px;
  display: flex;
  justify-content: flex-end;
}

.image-modal-body {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  max-height: calc(90vh - 60px);
  overflow: auto;
}

.enlarged-image {
  max-width: 100%;
  max-height: calc(90vh - 100px);
  object-fit: contain;
}

.meal-type-options {
  display: flex;
  flex-direction: row;
  gap: 24px;
  margin-top: 8px;
  background: #1F1D2B;
  padding: 8px;
  border-radius: 8px;
  border: none;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.7);
  padding: 8px 16px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.radio-label input[type="radio"] {
  appearance: none;
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  margin: 0;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
}

.radio-label label {
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  margin: 0;
}

.radio-label:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #ffffff;
}

.radio-label input[type="radio"]:checked {
  border-color: #EA7C69;
  background: #EA7C69;
}

.radio-label input[type="radio"]:checked::after {
  content: '';
  position: absolute;
  width: 6px;
  height: 6px;
  background: #ffffff;
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.image-upload {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}

.image-upload input[type="file"] {
  display: none;
}

.image-upload label {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #2D303E;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.image-upload label:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #ffffff;
}

.image-upload .upload-icon {
  color: var(--theme-orange);
  font-size: 16px;
}

.remove-image {
  color: #EA7C69;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.remove-image:hover {
  background: rgba(234, 124, 105, 0.1);
}

.form-group input[type="date"] {
  color-scheme: dark;
  font-family: inherit;
  padding-right: 32px;
}

.form-group input[type="date"]::-webkit-calendar-picker-indicator {
  display: none;
}

.input-group {
  position: relative;
  width: 100%;
}

.input-group input {
  width: 100%;
  padding-right: 32px;
}

.input-group i {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  color: #EA7C69;
  cursor: pointer;
  pointer-events: auto;
}

.week-picker-container {
  position: relative;
  width: 100%;
}

.status-select {
  width: 100%;
  padding: 8px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  background: #2D303E;
  color: #ffffff;
  font-family: inherit;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23EA7C69' d='M6 8.825L1.175 4 2.238 2.938 6 6.7l3.763-3.763L10.825 4z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
  padding-right: 32px;
}

.status-select:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(234, 124, 105, 0.2);
}

.status-select option {
  background: #2D303E;
  color: #ffffff;
  padding: 8px;
}

.form-group select:disabled {
  background: #2D303E;
  color: rgba(255, 255, 255, 0.7);
  cursor: not-allowed;
  background-image: none;
  padding-right: 8px;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}

@media (max-width: 768px) {
  .image-preview-grid {
    flex-direction: column;
    align-items: stretch;
  }
  
  .image-preview {
    width: 100%;
    height: 150px;
  }
  
  .image-upload-input {
    margin-top: 16px;
  }
}

@media (max-width: 480px) {
  .image-preview {
    height: 120px;
  }
}

.title-row {
  display: flex;
  gap: 16px;
  align-items: center;
}

.title-row .form-control {
  flex: 1;
}

.calories-input {
  position: relative;
  width: 120px;
}

.calories-input .form-control {
  width: 100%;
  padding-right: 40px;
}

.calories-unit {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
}
</style> 