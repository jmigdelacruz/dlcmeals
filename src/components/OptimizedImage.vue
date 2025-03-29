<template>
  <img
    :src="src"
    :alt="alt"
    :width="width"
    :height="height"
    loading="lazy"
    decoding="async"
    class="optimized-image"
    @error="handleError"
  >
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  src: {
    type: String,
    required: true
  },
  alt: {
    type: String,
    default: ''
  },
  width: {
    type: Number,
    default: 300
  },
  height: {
    type: Number,
    default: 200
  }
})

const handleError = (e) => {
  e.target.src = '/placeholder-image.jpg' // Add a placeholder image
}
</script>

<style scoped>
.optimized-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  background-color: #f5f5f5;
}
</style> 