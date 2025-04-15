<template>
  <div class="app">
    <nav v-if="showNav" class="nav-bar">
      <router-link to="/" class="nav-link">
        <i class="fas fa-columns"></i> Kanban Board
      </router-link>
      <router-link to="/analytics" class="nav-link">
        <i class="fas fa-chart-line"></i> Analytics
      </router-link>
    </nav>
    <router-view></router-view>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const showNav = computed(() => route.path === '/analytics')
</script>

<style>
.app {
  min-height: 100vh;
  background-color: #1a1a1a;
  color: #e0e0e0;
}

.nav-bar {
  background-color: #2d2d2d;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  display: flex;
  gap: 1rem;
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-link {
  color: #e0e0e0;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.nav-link:hover {
  background-color: #3d3d3d;
  transform: translateY(-1px);
}

.nav-link.router-link-active {
  background-color: #3d3d3d;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.nav-link i {
  font-size: 1.1em;
}

/* Global styles */
body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #1a1a1a;
  color: #e0e0e0;
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #2d2d2d;
}

::-webkit-scrollbar-thumb {
  background: #3d3d3d;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #4d4d4d;
}
</style>
