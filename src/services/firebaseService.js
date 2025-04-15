import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot,
  query,
  orderBy,
  setDoc,
  serverTimestamp,
  getDocs
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from '../firebase'

// Tasks Collection
const TASKS_COLLECTION = 'tasks'

// Get all tasks
export const getTasks = async () => {
  try {
    const q = query(collection(db, TASKS_COLLECTION), orderBy('createdAt', 'desc'))
    const querySnapshot = await getDocs(q)
    const tasks = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      // Ensure we have a valid date
      const taskDate = data.date || data.createdAt || new Date().toISOString()
      tasks.push({ 
        id: doc.id, 
        ...data,
        date: taskDate
      })
    })
    return tasks
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return []
  }
}

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
    console.log('Uploaded image URL:', url)
    return {
      url: url,
      filename: snapshot.ref.name
    }
  } catch (error) {
    console.error('Error uploading image:', error)
    throw error
  }
}

// Delete image from Firebase Storage
export const deleteImage = async (filename) => {
  try {
    if (!filename) return

    const imageRef = ref(storage, `images/${filename}`)
    await deleteObject(imageRef)
    console.log('Image deleted successfully')
  } catch (error) {
    console.error('Error deleting image:', error)
    throw error
  }
}

// Weight-related functions
export const getWeightData = async () => {
  try {
    const dayDetailsRef = collection(db, 'dayDetails')
    const q = query(dayDetailsRef, orderBy('updatedAt', 'desc'))
    const querySnapshot = await getDocs(q)
    
    const weightData = {}
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      console.log('Day details data:', data)
      if (data.weight) {
        weightData[doc.id] = data.weight
      }
    })
    
    console.log('Fetched weight data:', weightData)
    return weightData
  } catch (error) {
    console.error('Error fetching weight data:', error)
    return {}
  }
}

export const subscribeToWeights = (callback) => {
  const weightsRef = collection(db, 'weights')
  return onSnapshot(weightsRef, (snapshot) => {
    const weights = {}
    snapshot.forEach((doc) => {
      const data = doc.data()
      const date = data.date || doc.id
      weights[date] = data.weight
    })
    callback(weights)
  })
}

export const saveWeight = async (date, weight) => {
  try {
    console.log('Saving weight:', { date, weight })
    const weightRef = doc(db, 'weights', date)
    await setDoc(weightRef, { 
      weight,
      date,
      updatedAt: serverTimestamp()
    }, { merge: true })
    console.log('Weight saved successfully')
  } catch (error) {
    console.error('Error saving weight:', error)
    throw error
  }
}

// Day details functions
export const getDayDetails = async () => {
  try {
    const dayDetailsRef = collection(db, 'dayDetails')
    const q = query(dayDetailsRef, orderBy('updatedAt', 'desc'))
    const querySnapshot = await getDocs(q)
    
    const dayDetails = {}
    querySnapshot.forEach((doc) => {
      dayDetails[doc.id] = doc.data()
    })
    
    return dayDetails
  } catch (error) {
    console.error('Error fetching day details:', error)
    return {}
  }
}

export const subscribeToDayDetails = (callback) => {
  const dayDetailsRef = collection(db, 'dayDetails')
  return onSnapshot(dayDetailsRef, (snapshot) => {
    const dayDetails = {}
    snapshot.forEach((doc) => {
      dayDetails[doc.id] = doc.data()
    })
    callback(dayDetails)
  })
}

export const saveDayDetails = async (date, weight, cardio) => {
  try {
    const docRef = doc(db, 'dayDetails', date)
    await setDoc(docRef, {
      weight,
      cardio,
      updatedAt: serverTimestamp()
    }, { merge: true })
  } catch (error) {
    console.error('Error saving day details:', error)
    throw error
  }
}

// Cardio functions
export const getCardioData = async () => {
  try {
    const dayDetailsRef = collection(db, 'dayDetails')
    const q = query(dayDetailsRef, orderBy('updatedAt', 'desc'))
    const querySnapshot = await getDocs(q)
    
    const cardioData = {}
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      console.log('Day details data:', data)
      if (data.cardio) {
        cardioData[doc.id] = {
          activity: 'Cardio',
          duration: data.cardio
        }
      }
    })
    
    console.log('Fetched cardio data:', cardioData)
    return cardioData
  } catch (error) {
    console.error('Error fetching cardio data:', error)
    return {}
  }
}

export const saveCardio = async (date, cardioData) => {
  try {
    console.log('Saving cardio:', { date, cardioData })
    const cardioRef = doc(db, 'cardio', date)
    await setDoc(cardioRef, {
      ...cardioData,
      date,
      updatedAt: serverTimestamp()
    }, { merge: true })
    console.log('Cardio saved successfully')
  } catch (error) {
    console.error('Error saving cardio:', error)
    throw error
  }
} 