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
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  getStorage
} from 'firebase/storage'
import { initializeApp } from 'firebase/app'
import { db } from '../firebase'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const storage = getStorage(app)

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
    console.log('Adding new task to Firestore:', task)
    if (!db) {
      throw new Error('Firestore is not initialized')
    }
    const docRef = await addDoc(collection(db, TASKS_COLLECTION), {
      ...task,
      createdAt: new Date().toISOString()
    })
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

// Upload an image
export const uploadImage = async (file) => {
  try {
    console.log('Uploading image to Firebase Storage:', file.name)
    const storageRef = ref(storage, `images/${Date.now()}_${file.name}`)
    const snapshot = await uploadBytes(storageRef, file)
    const downloadURL = await getDownloadURL(snapshot.ref)
    console.log('Image uploaded successfully:', downloadURL)
    return {
      url: downloadURL,
      name: file.name,
      type: file.type,
      size: file.size
    }
  } catch (error) {
    console.error('Error uploading image:', error)
    throw error
  }
}

// Delete an image
export const deleteImage = async (imageUrl) => {
  try {
    console.log('Deleting image from Firebase Storage:', imageUrl)
    // Extract the path from the URL
    const url = new URL(imageUrl)
    const path = decodeURIComponent(url.pathname.split('/o/')[1].split('?')[0])
    const imageRef = ref(storage, path)
    await deleteObject(imageRef)
    console.log('Image deleted successfully')
  } catch (error) {
    console.error('Error deleting image:', error)
    throw error
  }
} 