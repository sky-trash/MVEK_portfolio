<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

interface Student {
  id: string
  name: string
  group: string
  specialty: string
  avatar: string
  skills: string[]
  projects: Array<{ id: string; title: string }>
}

const route = useRoute()
const student = ref<Student | null>(null)
const loading = ref(true)

onMounted(async () => {
  try {
    // Здесь должен быть запрос к API по route.params.id
    // Заглушка для примера:
    student.value = {
      id: route.params.id as string,
      name: 'Иван Петров',
      group: 'ДИЗ-201',
      specialty: 'Графический дизайн',
      avatar: '/default-avatar.jpg',
      skills: ['Figma', 'Photoshop', 'Illustrator'],
      projects: [
        { id: '1', title: 'Логотип для кафе' },
        { id: '2', title: 'Упаковка продукции' }
      ]
    }
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
})
</script>
<template>
  <div class="student-profile">
    <div v-if="loading" class="loading">Загрузка...</div>
    <div v-else-if="student" class="profile-content">
      <div class="profile-header">
        <img :src="student.avatar" :alt="student.name" class="avatar">
        <h1>{{ student.name }}</h1>
        <p class="meta">
          Группа: {{ student.group }} | 
          Специальность: {{ student.specialty }}
        </p>
      </div>
      
      <div class="profile-details">
        <h2>Навыки</h2>
        <ul class="skills">
          <li v-for="skill in student.skills" :key="skill">{{ skill }}</li>
        </ul>

        <h2>Проекты</h2>
        <div class="projects-grid">
          <router-link 
            v-for="project in student.projects" 
            :key="project.id"
            :to="`/projects/${project.id}`"
            class="project-card"
          >
            {{ project.title }}
          </router-link>
        </div>
      </div>
    </div>
    <div v-else class="not-found">Студент не найден</div>
  </div>
</template>

<style scoped>
.student-profile {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}
.avatar {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  object-fit: cover;
}
.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 15px;
}
.project-card {
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
}
</style>