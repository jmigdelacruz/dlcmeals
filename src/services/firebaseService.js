import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from '../firebase'

// Tasks Collection
const TASKS_COLLECTION = 'tasks'

// Get all tasks
export const subscribeToTasks = (callback) => {
  console.log('Setting up tasks subscription...')
  if (!db) {
    throw new Error('Firestore is not initialized')
  }
  const q = query(collection(db, TASKS_COLLECTION), orderBy('createdAt', 'desc'))
  return onSnapshot(q, 
    (snapshot) => {
      console.log('Received snapshot from Firestore')
      const tasks = []
      snapshot.forEach((doc) => {
        tasks.push({ id: doc.id, ...doc.data() })
      })
      console.log('Processed tasks:', tasks)
      callback(tasks)
    },
    (error) => {
      console.error('Error in tasks subscription:', error)
    }
  )
}

// Add a new task
export const addTask = async (task) => {
  try {
    console.log('Adding new task to Firestore - Raw task:', task)
    console.log('Calories value:', task.calories)
    console.log('Calories type:', typeof task.calories)
    
    if (!db) {
      throw new Error('Firestore is not initialized')
    }
    
    const taskData = {
      ...task,
      createdAt: new Date().toISOString()
    }
    
    console.log('Final task data being saved to Firestore:', taskData)
    
    const docRef = await addDoc(collection(db, TASKS_COLLECTION), taskData)
    console.log('Task added successfully with ID:', docRef.id)
    return docRef.id
  } catch (error) {
    console.error('Error adding task:', error)
    throw error
  }
}

// Update a task
export const updateTask = async (taskId, updates) => {
  try {
    console.log('Updating task in Firestore:', taskId, updates)
    if (!db) {
      throw new Error('Firestore is not initialized')
    }
    const taskRef = doc(db, TASKS_COLLECTION, taskId)
    await updateDoc(taskRef, updates)
    console.log('Task updated successfully')
  } catch (error) {
    console.error('Error updating task:', error)
    throw error
  }
}

// Delete a task
export const deleteTask = async (taskId) => {
  try {
    console.log('Deleting task from Firestore:', taskId)
    const taskRef = doc(db, TASKS_COLLECTION, taskId)
    await deleteDoc(taskRef)
    console.log('Task deleted successfully')
  } catch (error) {
    console.error('Error deleting task:', error)
    throw error
  }
}

// Upload image to Firebase Storage
export const uploadImage = async (file) => {
  try {
    console.log('Starting image upload:', file.name)
    const storageRef = ref(storage, `images/${Date.now()}_${file.name}`)
    console.log('Storage reference:', storageRef.fullPath)
    const snapshot = await uploadBytes(storageRef, file)
    console.log('Upload completed:', snapshot.ref.fullPath)
    const url = await getDownloadURL(snapshot.ref)
    console.log('Download URL:', url)
    // Store the full URL in the object
    return { url, path: snapshot.ref.fullPath }
  } catch (error) {
    console.error('Error uploading image:', error)
    throw error
  }
}

// Delete image from Firebase Storage
export const deleteImage = async (url) => {
  try {
    if (!url) {
      throw new Error('Image URL is required')
    }

    // Log the URL for debugging
    console.log('Attempting to delete image with URL:', url)

    // Extract the path from the full URL
    let path
    try {
      const urlObj = new URL(url)
      // The path will be in the format: /v0/b/{bucket}/o/{path}?alt=media&token={token}
      const pathMatch = urlObj.pathname.match(/\/v0\/b\/[^/]+\/o\/(.+)/)
      if (!pathMatch) {
        throw new Error('Invalid Firebase Storage URL format')
      }
      path = decodeURIComponent(pathMatch[1].split('?')[0])
    } catch (urlError) {
      console.error('Error parsing URL:', urlError)
      throw new Error('Invalid image URL format')
    }

    console.log('Extracted path:', path)
    const imageRef = ref(storage, path)
    await deleteObject(imageRef)
    console.log('Image deleted successfully')
  } catch (error) {
    console.error('Error deleting image:', error)
    throw error
  }
} 