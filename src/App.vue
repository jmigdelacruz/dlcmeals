<template>
  <div id="app">
    <KanbanBoard />
  </div>
</template>

<script setup>
import KanbanBoard from './components/KanbanBoard.vue'
</script>

<style>
@import '@fortawesome/fontawesome-free/css/all.css';

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  background: #f0f2f5;
}

#app {
  min-height: 100vh;
}
</style>
