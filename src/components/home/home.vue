<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore'
import { db } from '@/firebase'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import Header from '../layouts/header/header.vue'
import Footer from '../layouts/footer/footer.vue'

const router = useRouter()
const auth = getAuth()

// Данные
const projects = ref<any[]>([])
const currentUser = ref<any>(null)
const allUsers = ref<any[]>([])

// Фильтры
const searchQuery = ref('')
const selectedGroup = ref('')
const selectedSpecialty = ref('')
const selectedProjectType = ref('')

// Состояние загрузки
const isLoading = ref(true)

// Уникальные значения для фильтров
const groups = ref<string[]>([])
const specialties = ref<string[]>([])
const projectTypes = ref<string[]>([])

// Вспомогательная функция для безопасного получения значений
const getSafeValue = (obj: any, key: string): string => {
  if (!obj || typeof obj !== 'object') return ''
  
  // Проверяем различные варианты написания ключа
  const keys = Object.keys(obj)
  const foundKey = keys.find(k => k.toLowerCase() === key.toLowerCase())
  
  if (foundKey) {
    const value = obj[foundKey]
    return value ? String(value).trim() : ''
  }
  
  return ''
}

// Нормализация строки для сравнения
const normalizeString = (str: string): string => {
  return str ? str.toString().toLowerCase().trim().replace(/\s+/g, ' ') : ''
}

// Загрузка всех пользователей
const loadAllUsers = async () => {
  try {
    const usersQuery = query(collection(db, 'users'))
    const usersSnapshot = await getDocs(usersQuery)
    
    if (!usersSnapshot.empty) {
      allUsers.value = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    }
  } catch (error) {
    console.error('Ошибка загрузки пользователей:', error)
  }
}

// Загрузка текущего пользователя
const loadCurrentUser = async () => {
  try {
    const user = auth.currentUser
    if (!user) return null

    const usersQuery = query(collection(db, 'users'), where('userId', '==', user.uid))
    const usersSnapshot = await getDocs(usersQuery)
    
    if (!usersSnapshot.empty) {
      currentUser.value = {
        id: usersSnapshot.docs[0].id,
        ...usersSnapshot.docs[0].data()
      }
    }
  } catch (error) {
    console.error('Ошибка загрузки пользователя:', error)
  }
}

// Загрузка проектов
const loadProjects = async () => {
  try {
    const projectsQuery = query(collection(db, 'projects'), orderBy('createdAt', 'desc'))
    const projectsSnapshot = await getDocs(projectsQuery)

    if (projectsSnapshot.empty) {
      projects.value = []
    } else {
      projects.value = projectsSnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          title: getSafeValue(data, 'title') || 'Без названия',
          authorName: getSafeValue(data, 'authorName') || 'Неизвестен',
          group: getSafeValue(data, 'group'),
          specialty: getSafeValue(data, 'specialty'),
          type: getSafeValue(data, 'type'),
          description: getSafeValue(data, 'description'),
          images: Array.isArray(data.images) ? data.images : [],
          views: Number(data.views) || 0,
          likes: Number(data.likes) || 0,
          totalRating: Number(data.totalRating) || 0,
          ratingCount: Number(data.ratingCount) || 0
        }
      })
    }
  } catch (error) {
    console.error('Ошибка загрузки проектов:', error)
    projects.value = []
  }
}

// Загрузка всех данных
const loadData = async () => {
  try {
    isLoading.value = true
    
    await Promise.all([
      loadProjects(),
      loadAllUsers(),
      loadCurrentUser()
    ])

    // Собираем уникальные значения для фильтров
    const uniqueGroups = new Set<string>()
    const uniqueSpecialties = new Set<string>()
    const uniqueTypes = new Set<string>()

    // Добавляем значения из проектов
    projects.value.forEach(project => {
      if (project.group) uniqueGroups.add(project.group)
      if (project.specialty) uniqueSpecialties.add(project.specialty)
      if (project.type) uniqueTypes.add(project.type)
    })

    // Добавляем значения из пользователей
    allUsers.value.forEach(user => {
      const userGroup = getSafeValue(user, 'group')
      const userSpecialty = getSafeValue(user, 'specialty')
      
      if (userGroup) uniqueGroups.add(userGroup)
      if (userSpecialty) uniqueSpecialties.add(userSpecialty)
    })

    groups.value = Array.from(uniqueGroups).sort((a, b) => a.localeCompare(b))
    specialties.value = Array.from(uniqueSpecialties).sort((a, b) => a.localeCompare(b))
    projectTypes.value = Array.from(uniqueTypes).sort((a, b) => a.localeCompare(b))

  } catch (error) {
    console.error('Ошибка загрузки данных:', error)
  } finally {
    isLoading.value = false
  }
}

// Вычисляем отфильтрованные проекты
const filteredProjects = computed(() => {
  if (projects.value.length === 0) return []

  const searchTerm = normalizeString(searchQuery.value)

  return projects.value.filter(project => {
    // Поиск по нескольким полям
    const matchesSearch = searchTerm === '' ||
      normalizeString(project.title).includes(searchTerm) ||
      normalizeString(project.authorName).includes(searchTerm) ||
      normalizeString(project.group).includes(searchTerm) ||
      normalizeString(project.description).includes(searchTerm) ||
      normalizeString(project.specialty).includes(searchTerm)

    // Фильтрация по группе
    const matchesGroup = selectedGroup.value === '' ||
      normalizeString(project.group) === normalizeString(selectedGroup.value)

    // Фильтрация по специальности
    const matchesSpecialty = selectedSpecialty.value === '' ||
      normalizeString(project.specialty) === normalizeString(selectedSpecialty.value)

    // Фильтрация по типу проекта
    const matchesProjectType = selectedProjectType.value === '' ||
      normalizeString(project.type) === normalizeString(selectedProjectType.value)

    return matchesSearch && matchesGroup && matchesSpecialty && matchesProjectType
  })
})


// Переход на детальную страницу
const goToProjectDetail = (projectId: string) => {
  router.push(`/project/${projectId}`)
}

// Сброс фильтров
const clearFilters = () => {
  searchQuery.value = ''
  selectedGroup.value = ''
  selectedSpecialty.value = ''
  selectedProjectType.value = ''
}

// Фильтрация по группе пользователя
const filterByUserGroup = () => {
  if (currentUser.value) {
    const userGroup = getSafeValue(currentUser.value, 'group')
    if (userGroup) {
      selectedGroup.value = userGroup
      selectedSpecialty.value = ''
      selectedProjectType.value = ''
    }
  }
}

// Фильтрация по специальности пользователя
const filterByUserSpecialty = () => {
  if (currentUser.value) {
    const userSpecialty = getSafeValue(currentUser.value, 'specialty')
    if (userSpecialty) {
      selectedSpecialty.value = userSpecialty
      selectedGroup.value = ''
      selectedProjectType.value = ''
    }
  }
}

onMounted(() => {
  loadData()

  // Слушатель изменения статуса аутентификации
  onAuthStateChanged(auth, (user) => {
    if (user) {
      loadCurrentUser()
    } else {
      currentUser.value = null
    }
  })
})
</script>

<template>
  <Header />
  <main class="home-page">
    <!-- Баннер с названием -->
    <section class="banner">
      <h1 class="banner__title">Портфолио МВЕК</h1>
    </section>

    <!-- Поисковая строка с фильтрами -->
    <section class="search-section">
      <div class="search-container">
        <input v-model="searchQuery" type="text" class="search-input"
          placeholder="Поиск по имени, группе, проекту или описанию..." />
        <button @click="clearFilters" class="clear-button">Сбросить</button>
      </div>

      <div class="filters">
        <select v-model="selectedGroup" class="filter-select">
          <option value="">Все группы</option>
          <option v-for="group in groups" :key="group" :value="group">{{ group }}</option>
        </select>

        <select v-model="selectedSpecialty" class="filter-select">
          <option value="">Все специальности</option>
          <option v-for="specialty in specialties" :key="specialty" :value="specialty">{{ specialty }}</option>
        </select>

        <select v-model="selectedProjectType" class="filter-select">
          <option value="">Все типы проектов</option>
          <option v-for="type in projectTypes" :key="type" :value="type">{{ type }}</option>
        </select>

        <!-- Кнопки для фильтрации по данным пользователя -->
        <div class="user-filters" v-if="currentUser">
          <button @click="filterByUserGroup" class="user-filter-button group-button" 
                  v-if="getSafeValue(currentUser, 'group')">
            Моя группа: {{ getSafeValue(currentUser, 'group') }}
          </button>
          <button @click="filterByUserSpecialty" class="user-filter-button specialty-button"
                  v-if="getSafeValue(currentUser, 'specialty')">
            Моя специальность: {{ getSafeValue(currentUser, 'specialty') }}
          </button>
        </div>
      </div>

      <!-- Информация о результатах -->
      <div class="results-info" v-if="projects.length > 0">
        <p class="results-count">Найдено проектов: {{ filteredProjects.length }} из {{ projects.length }}</p>
        <p class="filter-info" v-if="selectedGroup">Фильтр по группе: {{ selectedGroup }}</p>
        <p class="filter-info" v-if="selectedSpecialty">Фильтр по специальности: {{ selectedSpecialty }}</p>
        <p class="user-filter-info" v-if="currentUser && selectedGroup === getSafeValue(currentUser, 'group')">
          Показаны проекты вашей группы
        </p>
        <p class="user-filter-info" v-if="currentUser && selectedSpecialty === getSafeValue(currentUser, 'specialty')">
          Показаны проекты вашей специальности
        </p>
      </div>
    </section>

    <!-- Лучшие работы -->
    <section class="featured-works">
      <h2 class="section-title">Лучшие работы</h2>

      <div v-if="isLoading" class="loading">
        <p>Загрузка проектов...</p>
      </div>

      <div v-else-if="projects.length === 0" class="no-results">
        <p>Проекты не найдены в базе данных.</p>
        <button @click="loadData" class="clear-button">Попробовать снова</button>
      </div>

      <div v-else-if="filteredProjects.length === 0" class="no-results">
        <p>Проекты не найдены по выбранным фильтрам.</p>
        <button @click="clearFilters" class="clear-button">Сбросить фильтры</button>
      </div>

      <div v-else class="works-grid">
        <div v-for="project in filteredProjects" :key="project.id" class="project-card"
          @click="goToProjectDetail(project.id)">
          <div class="project-image" v-if="project.images && project.images.length">
            <img :src="project.images[0]" :alt="project.title" />
          </div>
          <div class="project-info">
            <h3 class="project-title">{{ project.title }}</h3>
            <p class="project-author">Автор: {{ project.authorName }}</p>
            <p class="project-group" v-if="project.group">Группа: {{ project.group }}</p>
            <p class="project-specialty" v-if="project.specialty">Специальность: {{ project.specialty }}</p>
            <p class="project-type">Тип: {{ project.type || 'Не указан' }}</p>
            <div class="project-stats">
              <span class="views">👁️ {{ project.views }}</span>
              <span class="likes">❤️ {{ project.likes }}</span>
              <span class="rating">⭐ {{ project.ratingCount ? (project.totalRating / project.ratingCount).toFixed(1) : '0.0' }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>
  <Footer />
</template>

<style scoped>

.banner {
  text-align: center;
  padding: 2rem 0;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  margin-bottom: 2rem;
}

.banner__title {
  font-size: 2.5rem;
  color: white;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.search-section {
  background: rgba(255, 255, 255, 0.95);
  padding: 1.5rem;
  border-radius: 12px;
  margin: 0 2rem 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.search-container {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  align-items: center;
}

.search-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.3s ease;
}

.search-input:focus {
  border-color: #667eea;
}

.clear-button {
  padding: 0.75rem 1.5rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.3s ease;
}

.clear-button:hover {
  background: #5a67d8;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1rem;
}

.filter-select {
  padding: 0.75rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  font-size: 0.9rem;
  min-width: 180px;
  outline: none;
  transition: border-color 0.3s ease;
}

.filter-select:focus {
  border-color: #667eea;
}

.user-filters {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.user-filter-button {
  padding: 0.6rem 1rem;
  border: 2px solid;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  outline: none;
}

.user-filter-button.group-button {
  background: rgba(102, 126, 234, 0.1);
  border-color: #667eea;
  color: #667eea;
}

.user-filter-button.group-button:hover {
  background: #667eea;
  color: white;
}

.user-filter-button.specialty-button {
  background: rgba(118, 75, 162, 0.1);
  border-color: #764ba2;
  color: #764ba2;
}

.user-filter-button.specialty-button:hover {
  background: #764ba2;
  color: white;
}

.results-info {
  padding: 1rem;
  background: #f7fafc;
  border-radius: 8px;
  border-left: 4px solid #667eea;
}

.results-count {
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 0.5rem;
  font-size: 1rem;
}

.filter-info {
  color: #4a5568;
  font-size: 0.9rem;
  margin: 0.25rem 0;
  padding-left: 0.5rem;
  border-left: 2px solid #cbd5e0;
}

.user-filter-info {
  color: #667eea;
  font-weight: 500;
  font-size: 0.9rem;
  margin: 0.25rem 0;
  padding-left: 0.5rem;
  border-left: 2px solid #667eea;
}

.featured-works {
  padding: 0 2rem 2rem;
}

.section-title {
  text-align: center;
  color: white;
  font-size: 2rem;
  margin-bottom: 2rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.loading, .no-results {
  text-align: center;
  padding: 3rem;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  color: #4a5568;
}

.works-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.project-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.project-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.project-image img {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.project-info {
  padding: 1.5rem;
}

.project-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 0.75rem;
}

.project-author, .project-group, .project-specialty, .project-type {
  color: #4a5568;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.project-stats {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid #e2e8f0;
}

.project-stats span {
  font-size: 0.85rem;
  color: #718096;
}

@media (max-width: 768px) {
  .search-section {
    margin: 0 1rem 1.5rem;
    padding: 1rem;
  }
  
  .filters {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-select {
    min-width: auto;
    width: 100%;
  }
  
  .user-filters {
    justify-content: center;
  }
  
  .featured-works {
    padding: 0 1rem 1.5rem;
  }
  
  .works-grid {
    grid-template-columns: 1fr;
  }
}
</style>
<style scoped>
@import "./home.scss";
</style>