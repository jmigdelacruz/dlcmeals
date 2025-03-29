import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

// Register service worker
if ('serviceWorker' in navigator) {
  // Force reload when a new service worker is available
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('ServiceWorker registration successful');

        // Check for updates immediately
        registration.update();

        // Check for updates periodically (every hour)
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);
      })
      .catch(err => {
        console.log('ServiceWorker registration failed: ', err);
      });
  });
}

createApp(App).mount('#app')
