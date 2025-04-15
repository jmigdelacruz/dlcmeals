import { createRouter, createWebHistory } from 'vue-router'
import KanbanBoard from '../components/KanbanBoard.vue'
import Analytics from '../views/Analytics.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: KanbanBoard
  },
  {
    path: '/analytics',
    name: 'analytics',
    component: Analytics
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router 