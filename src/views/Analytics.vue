<template>
  <div class="analytics-container">
    <h1>Analytics</h1>
    <div class="analytics-content">
      <div v-if="loading" class="loading">
        Loading data...
      </div>
      <div v-else-if="error" class="error">
        {{ error }}
      </div>
      <template v-else>
        <!-- Calorie Chart Section -->
        <div class="data-section chart-section">
          <h2>Daily Health Metrics</h2>
          <div class="chart-container">
            <Line
              v-if="chartData.labels.length > 0"
              :data="chartData"
              :options="chartOptions"
            />
            <div v-else class="no-data">
              No data available
            </div>
          </div>
        </div>

        <!-- Existing Tables -->
        <div class="data-section">
          <h2>Meals</h2>
          <table class="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Meal</th>
                <th>Calories</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="meal in sortedMeals" :key="meal.id">
                <td>{{ formatDate(meal.mealDate || meal.date) }}</td>
                <td>{{ meal.title }}</td>
                <td>{{ meal.calories }}</td>
                <td>{{ meal.status }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="data-section">
          <h2>Weight Tracking</h2>
          <table class="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Weight (kg)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(weight, date) in weights" :key="date">
                <td>{{ formatDate(date) }}</td>
                <td>{{ weight }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="data-section">
          <h2>Cardio Activities</h2>
          <table class="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Activity</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(cardio, date) in cardioActivities" :key="date">
                <td>{{ formatDate(date) }}</td>
                <td>{{ cardio.activity }}</td>
                <td>{{ cardio.duration }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { Line } from 'vue-chartjs'
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  Title, 
  Tooltip, 
  Legend
} from 'chart.js'
import { getTasks, getWeightData, getCardioData } from '../services/firebaseService'

// Define the afterDraw plugin
const afterDrawPlugin = {
  id: 'afterDraw',
  afterDraw: (chart) => {
    const { ctx, chartArea: { top, bottom, left, right, width, height }, scales: { x } } = chart;
    
    // Get the dates from the chart data
    const dates = chart.data.labels.map(label => {
      const [month, day, year] = label.split('/');
      return new Date(year, month - 1, day);
    });

    // Generate day of week labels
    const dayLabels = dates.map(date => 
      date.toLocaleDateString('en-US', { weekday: 'short' })
    );

    ctx.save();
    ctx.fillStyle = '#e0e0e0';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.font = '12px Arial';

    // Get the ticks and their positions
    const ticks = x.getTicks();
    
    // Draw labels at the top of the chart
    ticks.forEach((tick, index) => {
      const xPos = x.getPixelForTick(index);
      if (dayLabels[index]) {
        ctx.fillText(dayLabels[index], xPos, top - 5);
      }
    });

    ctx.restore();
  }
}

// Register the plugin
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  Title, 
  Tooltip, 
  Legend
)

// Register the custom plugin
ChartJS.register(afterDrawPlugin)

const meals = ref([])
const weights = ref({})
const cardioActivities = ref({})
const loading = ref(true)
const error = ref(null)

// Add computed property for sorted meals
const sortedMeals = computed(() => {
  return [...meals.value].sort((a, b) => {
    const dateA = a.mealDate || a.date
    const dateB = b.mealDate || b.date
    return dateB.localeCompare(dateA) // Sort in descending order (newest first)
  })
})

const formatDate = (dateString) => {
  if (!dateString) return 'No date'
  
  // Handle both mealDate format (YYYY-MM-DD) and ISO format
  const date = dateString.includes('T') ? dateString.split('T')[0] : dateString
  const [year, month, day] = date.split('-')
  
  // Format for display
  return `${month}/${day}/${year}`
}

// Chart data and options
const chartData = computed(() => {
  // Group meals by date and sum calories
  const dailyCalories = {}
  meals.value.forEach(meal => {
    // Use the mealDate directly from Firebase
    const date = meal.mealDate || meal.date.split('T')[0]
    
    if (!dailyCalories[date]) {
      dailyCalories[date] = 0
    }
    dailyCalories[date] += Number(meal.calories) || 0
  })

  // Sort dates
  const sortedDates = Object.keys(dailyCalories).sort()

  return {
    labels: sortedDates.map(date => {
      const [year, month, day] = date.split('-')
      return `${month}/${day}/${year}`
    }),
    datasets: [
      {
        label: 'Daily Calories',
        data: sortedDates.map(date => dailyCalories[date]),
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        tension: 0.4,
        fill: true,
        yAxisID: 'y',
        type: 'line'
      },
      {
        label: 'Weight (kg)',
        data: sortedDates.map(date => weights.value[date] || null),
        borderColor: '#EA7C69',
        backgroundColor: 'rgba(234, 124, 105, 0.1)',
        tension: 0.4,
        fill: false,
        yAxisID: 'y1',
        type: 'line'
      },
      {
        label: 'Cardio (min)',
        data: sortedDates.map(date => {
          const cardio = cardioActivities.value[date]
          return cardio ? cardio.duration : null
        }),
        backgroundColor: 'rgba(108, 92, 231, 0.5)',
        borderColor: '#6C5CE7',
        borderWidth: 1,
        yAxisID: 'y2',
        type: 'bar',
        barPercentage: 0.6
      }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'bottom',
      labels: {
        color: '#e0e0e0',
        usePointStyle: true,
        pointStyle: 'circle',
        padding: 20
      }
    }
  },
  scales: {
    y: {
      type: 'linear',
      display: true,
      position: 'left',
      title: {
        display: true,
        text: 'Calories',
        color: '#4CAF50'
      },
      grid: {
        color: 'rgba(255, 255, 255, 0.1)'
      },
      ticks: {
        color: '#e0e0e0'
      }
    },
    y1: {
      type: 'linear',
      display: true,
      position: 'right',
      title: {
        display: true,
        text: 'Weight (kg)',
        color: '#EA7C69'
      },
      grid: {
        drawOnChartArea: false
      },
      ticks: {
        color: '#e0e0e0'
      }
    },
    y2: {
      type: 'linear',
      display: true,
      position: 'right',
      title: {
        display: true,
        text: 'Cardio (min)',
        color: '#6C5CE7'
      },
      grid: {
        drawOnChartArea: false
      },
      ticks: {
        color: '#e0e0e0'
      }
    },
    x: {
      grid: {
        color: 'rgba(255, 255, 255, 0.1)'
      },
      ticks: {
        color: '#e0e0e0',
        maxRotation: 0,
        padding: 10
      }
    }
  },
  layout: {
    padding: {
      top: 30
    }
  }
}

const loadData = async () => {
  try {
    loading.value = true
    error.value = null

    // Load all data in parallel
    const [tasksData, weightData, cardioData] = await Promise.all([
      getTasks(),
      getWeightData(),
      getCardioData()
    ])

    // Process tasks data to ensure dates are valid
    meals.value = tasksData.map(task => ({
      ...task,
      // Keep both date and mealDate for backward compatibility
      date: task.mealDate || task.date || task.createdAt || new Date().toISOString(),
      mealDate: task.mealDate || task.date?.split('T')[0] || task.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0]
    }))

    // Store weight and cardio data directly as they're already in the correct format
    weights.value = weightData
    cardioActivities.value = cardioData

    console.log('Loaded data:', {
      tasks: tasksData,
      weights: weightData,
      cardio: cardioData
    })
  } catch (err) {
    console.error('Error loading analytics data:', err)
    error.value = 'Failed to load analytics data. Please try again later.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.analytics-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  min-height: 100vh;
  background-color: #1a1a1a;
  color: #e0e0e0;
}

.analytics-content {
  margin-top: 20px;
}

.loading, .error {
  text-align: center;
  padding: 40px;
  background: #2d2d2d;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  color: #e0e0e0;
}

.error {
  color: #ff6b6b;
}

.data-section {
  margin-bottom: 40px;
  background: #2d2d2d;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.chart-section {
  margin-bottom: 40px;
}

.chart-container {
  height: 400px;
  width: 100%;
  position: relative;
}

.no-data {
  text-align: center;
  padding: 40px;
  color: #888;
}

h1 {
  color: #e0e0e0;
  margin-bottom: 30px;
  font-size: 2em;
  font-weight: 600;
}

h2 {
  color: #e0e0e0;
  margin-bottom: 20px;
  font-size: 1.5em;
  font-weight: 500;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
  background: #2d2d2d;
}

.data-table th,
.data-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #3d3d3d;
  color: #e0e0e0;
}

.data-table th {
  background-color: #3d3d3d;
  font-weight: 600;
  color: #e0e0e0;
}

.data-table tr:hover {
  background-color: #3d3d3d;
}

.data-table td {
  color: #e0e0e0;
}

/* Add some hover effects */
.data-section:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  transition: box-shadow 0.3s ease;
}

/* Add some spacing between sections */
.data-section + .data-section {
  margin-top: 20px;
}

/* Style the table headers */
.data-table th {
  text-transform: uppercase;
  font-size: 0.9em;
  letter-spacing: 0.5px;
}

/* Add some subtle animations */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.data-section {
  animation: fadeIn 0.3s ease-out;
}
</style> 