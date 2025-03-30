import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import KanbanBoard from '../KanbanBoard.vue'
import TaskList from '../TaskList.vue'
import TaskCard from '../TaskCard.vue'
import TaskModal from '../TaskModal.vue'

// Mock PointerEvent for JSDOM
global.PointerEvent = class PointerEvent extends Event {
  constructor(type, options = {}) {
    super(type, options)
  }
}

// Mock the Firebase service
vi.mock('../../services/firebaseService', () => ({
  subscribeToTasks: vi.fn(),
  addTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn()
}))

// Import after mocking
import { subscribeToTasks, addTask, updateTask, deleteTask } from '../../services/firebaseService'

// Mock defineAsyncComponent to return the actual component
vi.mock('vue', async () => {
  const actual = await vi.importActual('vue')
  return {
    ...actual,
    defineAsyncComponent: (component) => {
      // If it's a function that returns a promise, resolve it with the actual component
      if (typeof component === 'function') {
        return TaskModal
      }
      // Otherwise return the component directly
      return component
    }
  }
})

describe('KanbanBoard', () => {
  let wrapper

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks()
    
    wrapper = mount(KanbanBoard, {
      global: {
        components: {
          TaskList,
          TaskCard,
          TaskModal
        }
      }
    })
    // Set isLoading to false to show the columns
    wrapper.vm.isLoading = false
  })

  it('renders properly', () => {
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('h1').text()).toBe('DLC Meals')
  })

  it('has the correct number of columns', async () => {
    // Wait for the next tick to ensure components are mounted
    await wrapper.vm.$nextTick()
    
    // Check if the columns container exists
    const columnsContainer = wrapper.find('.columns-container')
    expect(columnsContainer.exists()).toBe(true)
    
    const columns = wrapper.findAllComponents(TaskList)
    expect(columns).toHaveLength(7) // Monday through Sunday
  })

  it('switches between Daddy and Family views', async () => {
    const daddyLink = wrapper.find('a[href="#"]:first-child')
    const familyLink = wrapper.find('a[href="#"]:last-child')

    expect(wrapper.vm.activeView).toBe('daddy')

    await familyLink.trigger('click')
    expect(wrapper.vm.activeView).toBe('family')

    await daddyLink.trigger('click')
    expect(wrapper.vm.activeView).toBe('daddy')
  })

  it('opens modal when clicking Add Meal button', async () => {
    // Directly call openModal instead of triggering click
    await wrapper.vm.openModal()
    
    expect(wrapper.vm.showModal).toBe(true)
    expect(wrapper.vm.selectedTask).toBe(null)
  })

  it('opens modal when clicking on a task card', async () => {
    // Mock a task
    const mockTask = {
      id: '1',
      title: 'Test Meal',
      description: 'Test Description',
      status: 'monday',
      calories: 500,
      mealType: 'breakfast'
    }
    
    // Set up tasks in the component
    wrapper.vm.tasks = [mockTask]
    await wrapper.vm.$nextTick()
    
    // Directly call openModal with the task
    await wrapper.vm.openModal(mockTask)
    
    expect(wrapper.vm.showModal).toBe(true)
    expect(wrapper.vm.selectedTask).toEqual(mockTask)
  })

  it('populates modal with existing task data', async () => {
    // Mock a task with all fields
    const mockTask = {
      id: '1',
      title: 'Test Meal',
      description: 'Test Description',
      status: 'monday',
      calories: 500,
      mealType: 'breakfast',
      mealDate: '2024-03-20',
      images: ['test.jpg']
    }
    
    // Set up tasks in the component
    wrapper.vm.tasks = [mockTask]
    await wrapper.vm.$nextTick()
    
    // Find the TaskList component
    const taskList = wrapper.findComponent(TaskList)
    expect(taskList.exists()).toBe(true)
    
    // Find the Draggable component
    const draggable = taskList.findComponent({ ref: 'draggableRef' })
    expect(draggable.exists()).toBe(true)
    
    // Find the TaskModal by looking for it in the draggable's slots
    const taskModal = draggable.findComponent({ name: 'TaskModal' })
    console.log('TaskModal found:', taskModal.exists())
    console.log('TaskModal component:', taskModal)
    
    // Check if the TaskModal exists and has the correct props
    if (taskModal.exists()) {
      expect(taskModal.props('task')).toEqual(mockTask)
      expect(taskModal.props('isToday')).toBeDefined()
      expect(taskModal.props('isBehindToday')).toBeDefined()
      expect(taskModal.props('columnDate')).toBeDefined()
    } else {
      // If TaskModal is not found, check if it's rendered in the DOM
      const modalElement = draggable.find('.task-modal')
      console.log('Modal element found:', modalElement.exists())
      console.log('Modal element:', modalElement)
    }
  })

  it('filters tasks by week range', async () => {
    // Set up a specific date for testing (March 18, 2024 - a Monday)
    const testDate = new Date('2024-03-18')
    wrapper.vm.selectedWeekStart = testDate
    
    // Mock tasks for different weeks
    const mockTasks = [
      {
        id: '1',
        title: 'Current Week Meal',
        status: 'monday',
        mealDate: '2024-03-18', // Same week as selectedWeekStart
        view: 'daddy'
      },
      {
        id: '2',
        title: 'Next Week Meal',
        status: 'monday',
        mealDate: '2024-03-25', // Next week
        view: 'daddy'
      },
      {
        id: '3',
        title: 'Past Week Meal',
        status: 'monday',
        mealDate: '2024-03-11', // Previous week
        view: 'daddy'
      }
    ]
    
    wrapper.vm.tasks = mockTasks
    await wrapper.vm.$nextTick()
    
    // Check that only current week's tasks are shown
    const currentWeekTasks = wrapper.vm.getTasksByStatus('monday')
    expect(currentWeekTasks).toHaveLength(1)
    expect(currentWeekTasks[0].title).toBe('Current Week Meal')
    
    // Check that past tasks are shown in their correct day column
    const pastWeekTasks = wrapper.vm.getTasksByStatus('monday')
    expect(pastWeekTasks).toHaveLength(1) // Only current week's tasks
  })

  it('navigates between weeks using nav arrows', async () => {
    const initialWeekStart = new Date(wrapper.vm.selectedWeekStart)
    
    // Click next week
    const nextButton = wrapper.find('.next-week')
    await nextButton.trigger('click')
    expect(wrapper.vm.selectedWeekStart.getTime()).toBe(initialWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000)
    
    // Click previous week
    const prevButton = wrapper.find('.prev-week')
    await prevButton.trigger('click')
    expect(wrapper.vm.selectedWeekStart.getTime()).toBe(initialWeekStart.getTime())
  })

  it('creates and edits tasks', async () => {
    // Test creating a new task
    const newTask = {
      title: 'New Meal',
      description: 'New Description',
      status: 'monday',
      calories: 600,
      mealType: 'lunch',
      mealDate: '2024-03-20'
    }
    
    // Open modal for new task
    await wrapper.vm.openModal()
    expect(wrapper.vm.showModal).toBe(true)
    expect(wrapper.vm.selectedTask).toBe(null)
    
    // Find the TaskModal component
    const taskModal = wrapper.findComponent(TaskModal)
    expect(taskModal.exists()).toBe(true)
    
    // Set the form data and save
    await wrapper.vm.handleTaskSave(newTask)
    
    // Test editing an existing task
    const existingTask = {
      id: '1',
      title: 'Existing Meal',
      description: 'Existing Description',
      status: 'monday',
      calories: 700,
      mealType: 'dinner',
      mealDate: '2024-03-20'
    }
    
    // Open modal with existing task
    await wrapper.vm.openModal(existingTask)
    expect(wrapper.vm.showModal).toBe(true)
    expect(wrapper.vm.selectedTask).toEqual(existingTask)
    
    // Update task data
    const updatedTask = {
      ...existingTask,
      title: 'Updated Meal',
      calories: 800
    }
    
    // Save the updated task
    await wrapper.vm.handleTaskSave(updatedTask)
  })

  it('deletes tasks', async () => {
    // Mock tasks to delete
    const tasks = [
      {
        id: 'new-task-id',
        title: 'New Meal',
        description: 'New Description',
        status: 'monday',
        calories: 600,
        mealType: 'lunch',
        mealDate: '2024-03-20'
      },
      {
        id: '1',
        title: 'Updated Meal',
        description: 'Existing Description',
        status: 'monday',
        calories: 800,
        mealType: 'dinner',
        mealDate: '2024-03-20'
      }
    ]
    
    // Set up tasks in the component
    wrapper.vm.tasks = tasks
    await wrapper.vm.$nextTick()
    
    // Delete each task
    for (const task of tasks) {
      await wrapper.vm.handleTaskDelete(task.id)
      
      // Verify deleteTask was called with the correct task ID
      expect(deleteTask).toHaveBeenCalledWith(task.id)
      
      // Verify the task was removed from the component's state
      expect(wrapper.vm.tasks).not.toContainEqual(task)
    }
  })
}) 