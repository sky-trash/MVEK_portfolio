<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

interface Author {
  id: string
  name: string
  avatar?: string
  group: string
  email?: string
}

interface Project {
  id: string
  title: string
  type: string
  createdAt: string
  likes: number
  author: Author
  images: string[]
  description: string
  technologies: string[]
}

const route = useRoute()
const project = ref<Project | null>(null)
const loading = ref(true)

const lightbox = ref({
  active: false,
  currentIndex: 0
})

const fetchProjectData = async (id: string) => {
  // Заглушка данных - в реальном приложении замените на API запрос
  return {
    id,
    title: 'Мобильное приложение для музея искусств',
    type: 'UX/UI дизайн',
    createdAt: '2025-03-15',
    likes: 124,
    author: {
      id: 'student-123',
      name: 'Александра Петрова',
      group: 'ДИЗ-301',
      email: 'a.petrova@mvek.edu',
      avatar: '/student-avatar.jpg'
    },
    images: [
      '/project-detail-1.jpg',
      '/project-detail-2.jpg',
      '/project-detail-3.jpg'
    ],
    description: `
      <p>Проект представляет собой мобильное приложение для Государственного музея изобразительных искусств. Основные задачи:</p>
      <ul>
        <li>Упрощение навигации по музейным экспозициям</li>
        <li>Создание интерактивной карты музея</li>
        <li>Разработка системы аудиогидов</li>
        <li>Интеграция с системой онлайн-билетов</li>
      </ul>
      <p>Приложение было разработано с учетом потребностей разных групп пользователей: от молодёжи до пожилых посетителей.</p>
    `,
    technologies: ['Figma', 'Adobe XD', 'Photoshop', 'Illustrator', 'After Effects']
  }
}

const formatDate = (dateString: string) => {
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' }
  return new Date(dateString).toLocaleDateString('ru-RU', options)
}

const openLightbox = (index: number) => {
  lightbox.value = {
    active: true,
    currentIndex: index
  }
  document.body.style.overflow = 'hidden'
}

const closeLightbox = () => {
  lightbox.value.active = false
  document.body.style.overflow = ''
}

const prevImage = () => {
  if (project.value) {
    lightbox.value.currentIndex =
      (lightbox.value.currentIndex - 1 + project.value.images.length) % project.value.images.length
  }
}

const nextImage = () => {
  if (project.value) {
    lightbox.value.currentIndex =
      (lightbox.value.currentIndex + 1) % project.value.images.length
  }
}

onMounted(async () => {
  try {
    const projectId = route.params.id as string
    project.value = await fetchProjectData(projectId)
  } catch (error) {
    console.error('Ошибка загрузки данных:', error)
  } finally {
    loading.value = false
  }
})
</script>
<template>
  <div class="project-details-container">
    <div v-if="loading" class="loading-spinner">
      <div class="spinner"></div>
    </div>

    <div v-else-if="project" class="project-details">
      <nav class="breadcrumbs">
        <router-link to="/projects">Все проекты</router-link>
        <span class="separator">/</span>
        <span>{{ project.title }}</span>
      </nav>

      <!-- Основная информация -->
      <div class="project-header">
        <div class="title-section">
          <h1 class="project-title">{{ project.title }}</h1>
          <div class="meta-info">
            <span class="project-type">{{ project.type }}</span>
            <span class="project-date">{{ formatDate(project.createdAt) }}</span>
          </div>
        </div>

        <div class="actions-section">
          <button class="action-button favorite">
            <span class="icon">♥</span>
            <span class="count">{{ project.likes }}</span>
          </button>
          <button class="action-button share">
            <span class="icon">↗</span>
            Поделиться
          </button>
        </div>
      </div>

      <!-- Автор проекта -->
      <div class="author-section">
        <router-link :to="`/students/${project.author.id}`" class="author-link">
          <img :src="project.author.avatar || '/default-avatar.jpg'" :alt="project.author.name" class="author-avatar">
          <div class="author-info">
            <span class="author-name">{{ project.author.name }}</span>
            <span class="author-group">{{ project.author.group }}</span>
          </div>
        </router-link>
        <div class="author-actions">
          <a v-if="project.author.email" :href="`mailto:${project.author.email}`" class="contact-button">
            Связаться
          </a>
        </div>
      </div>

      <!-- Галерея проекта -->
      <div class="project-gallery">
        <div v-for="(image, index) in project.images" :key="index" class="gallery-item"
          :class="{ 'featured': index === 0 }" @click="openLightbox(index)">
          <img :src="image" :alt="`Изображение проекта ${index + 1}`" class="gallery-image">
        </div>
      </div>

      <!-- Описание проекта -->
      <div class="project-description">
        <h2>О проекте</h2>
        <div class="description-content" v-html="project.description"></div>
      </div>

      <!-- Технологии и инструменты -->
      <div class="project-technologies">
        <h2>Использованные технологии</h2>
        <div class="tech-tags">
          <span v-for="tech in project.technologies" :key="tech" class="tech-tag">
            {{ tech }}
          </span>
        </div>
      </div>

      <!-- Лайтбокс -->
      <div v-if="lightbox.active" class="lightbox" @click.self="closeLightbox">
        <button class="lightbox-close" @click="closeLightbox">×</button>
        <button class="lightbox-nav prev" @click="prevImage">‹</button>
        <div class="lightbox-content">
          <img :src="project.images[lightbox.currentIndex]" class="lightbox-image">
          <div class="lightbox-counter">
            {{ lightbox.currentIndex + 1 }} / {{ project.images.length }}
          </div>
        </div>
        <button class="lightbox-nav next" @click="nextImage">›</button>
      </div>
    </div>

    <div v-else class="not-found-message">
      Проект не найден
      <router-link to="/projects" class="back-link">← К списку проектов</router-link>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import "./projectDetails.scss";
</style>