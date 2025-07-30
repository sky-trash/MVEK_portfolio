<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ProjectCard from '@/components/projectCard/projectCard.vue'

interface Group {
  id: string
  name: string
  studentCount: number
}

interface Project {
  id: string
  title: string
  previewImage: string
  type: string
  rating: number
}

interface Teacher {
  id: string
  name: string
  position: string
  avatar?: string
  isVerified: boolean
  rating: number
  bio: string
  experience: number
  specialization: string
  email: string
  groups: Group[]
  projects: Project[]
}

const route = useRoute()
const router = useRouter()
const teacher = ref<Teacher | null>(null)
const loading = ref(true)

const fetchTeacherData = async (id: string) => {
  // Заглушка данных - в реальном приложении замените на API запрос
  return {
    id,
    name: 'Иванова Мария Сергеевна',
    position: 'Старший преподаватель',
    avatar: '/teacher-avatar.jpg',
    isVerified: true,
    rating: 4.7,
    bio: 'Специалист в области графического дизайна с 15-летним опытом. Курирует дипломные проекты по направлению "Цифровой дизайн".',
    experience: 15,
    specialization: 'Графический дизайн, UX/UI',
    email: 'i.ivanova@mvek.edu',
    groups: [
      { id: 'diz-201', name: 'ДИЗ-201', studentCount: 24 },
      { id: 'diz-301', name: 'ДИЗ-301', studentCount: 18 }
    ],
    projects: [
      {
        id: '1',
        title: 'Мобильное приложение для музея',
        previewImage: '/project1.jpg',
        type: 'UX/UI дизайн',
        rating: 4.8
      },
      {
        id: '2',
        title: 'Фирменный стиль кофейни',
        previewImage: '/project2.jpg',
        type: 'Брендинг',
        rating: 4.5
      }
    ]
  }
}

onMounted(async () => {
  try {
    const teacherId = route.params.id as string
    teacher.value = await fetchTeacherData(teacherId)
  } catch (error) {
    console.error('Ошибка загрузки данных:', error)
  } finally {
    loading.value = false
  }
})

const navigateToProject = (projectId: string) => {
  router.push(`/projects/${projectId}`)
}
</script>
<template>
  <div class="teacher-profile-container">
    <div v-if="loading" class="loading-spinner">
      <div class="spinner"></div>
    </div>
    
    <div v-else-if="teacher" class="teacher-profile">
      <!-- Шапка профиля -->
      <div class="profile-header">
        <div class="avatar-container">
          <img 
            :src="teacher.avatar || '/default-teacher-avatar.jpg'" 
            :alt="teacher.name"
            class="avatar"
          >
          <div class="verified-badge" v-if="teacher.isVerified">✓</div>
        </div>
        
        <div class="profile-info">
          <h1 class="teacher-name">{{ teacher.name }}</h1>
          <p class="teacher-position">{{ teacher.position }}</p>
          
          <div class="rating-container">
            <div class="stars">
              <span 
                v-for="n in 5" 
                :key="n" 
                :class="['star', { 'filled': n <= teacher.rating }]"
              >★</span>
            </div>
            <span class="rating-value">{{ teacher.rating.toFixed(1) }}</span>
          </div>
        </div>
      </div>

      <!-- Основная информация -->
      <div class="profile-content">
        <section class="about-section">
          <h2>О преподавателе</h2>
          <p class="bio">{{ teacher.bio }}</p>
          
          <div class="details-grid">
            <div class="detail-item">
              <span class="detail-label">Стаж:</span>
              <span class="detail-value">{{ teacher.experience }} лет</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Специализация:</span>
              <span class="detail-value">{{ teacher.specialization }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Email:</span>
              <a :href="`mailto:${teacher.email}`" class="detail-value link">{{ teacher.email }}</a>
            </div>
          </div>
        </section>

        <!-- Курируемые группы -->
        <section class="groups-section">
          <h2>Курируемые группы</h2>
          <div class="groups-grid">
            <router-link
              v-for="group in teacher.groups"
              :key="group.id"
              :to="`/students?group=${group.id}`"
              class="group-card"
            >
              {{ group.name }}
              <span class="student-count">{{ group.studentCount }} студентов</span>
            </router-link>
          </div>
        </section>

        <!-- Студенческие проекты -->
        <section class="projects-section">
          <h2>Руководство проектами</h2>
          <div class="projects-grid">
            <project-card
              v-for="project in teacher.projects"
              :key="project.id"
              :project="project"
              @click="navigateToProject(project.id)"
            />
          </div>
        </section>
      </div>
    </div>
    
    <div v-else class="not-found-message">
      Преподаватель не найден
      <router-link to="/teachers" class="back-link">← К списку преподавателей</router-link>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import "./teacherProfile.scss";
</style>