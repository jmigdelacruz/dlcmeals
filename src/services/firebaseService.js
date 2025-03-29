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
    const storageRef = ref(storage, `images/${Date.now()}_${file.name}`)
    const snapshot = await uploadBytes(storageRef, file)
    const url = await getDownloadURL(snapshot.ref)
    return url
  } catch (error) {
    console.error('Error uploading image:', error)
    throw error
  }
}

// Delete image from Firebase Storage
export const deleteImage = async (url) => {
  try {
    const imageRef = ref(storage, url)
    await deleteObject(imageRef)
  } catch (error) {
    console.error('Error deleting image:', error)
    throw error
  }
} 