<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { 
  collection, 
  getDocs, 
  query, 
  orderBy,
  doc,
  getDoc
} from 'firebase/firestore'
import { db } from '@/firebase'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import Header from '../layouts/header/header.vue'
import Footer from '../layouts/footer/footer.vue'
import ProjectCard from '../projectCard/projectCard.vue'

const router = useRouter()
const auth = getAuth()

// Данные
const projects = ref<any[]>([])
const groups = ref<string[]>([])
const specialties = ref<string[]>([])
const projectTypes = ref<string[]>([])
const userGroups = ref<string[]>([])
const userSpecialties = ref<string[]>([])

// Фильтры
const searchQuery = ref('')
const selectedGroup = ref('')
const selectedSpecialty = ref('')
const selectedProjectType = ref('')
const showOnlyMyGroups = ref(false)
const showOnlyMySpecialties = ref(false)

// Состояние загрузки
const isLoading = ref(true)

// Загрузка данных пользователя
const loadUserData = async (userId: string) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId))
    if (userDoc.exists()) {
      const userData = userDoc.data()
      userGroups.value = userData.group ? [userData.group] : []
      userSpecialties.value = userData.specialty ? [userData.specialty] : []
      console.log('Данные пользователя загружены:', userData)
    }
  } catch (error) {
    console.error('Ошибка загрузки данных пользователя:', error)
  }
}

// Загрузка данных из Firebase
const loadData = async () => {
  try {
    isLoading.value = true
    console.log('Начинаем загрузку данных...')

    // Загрузка проектов
    const projectsQuery = query(collection(db, 'projects'), orderBy('createdAt', 'desc'))
    const projectsSnapshot = await getDocs(projectsQuery)
    projects.value = projectsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    console.log('Загружено проектов:', projects.value.length)
    console.log('Пример проекта:', projects.value[0])

    // Загрузка групп из коллекции groups
    try {
      const groupsSnapshot = await getDocs(collection(db, 'groups'))
      groups.value = groupsSnapshot.docs
        .map(doc => doc.data().name)
        .filter(name => name && name.trim() !== '')
      console.log('Загружено групп из коллекции:', groups.value)
    } catch (error) {
      console.log('Коллекция groups не найдена, извлекаем группы из проектов')
      const uniqueGroups = new Set<string>()
      projects.value.forEach(project => {
        if (project.group && project.group.trim() !== '') {
          uniqueGroups.add(project.group)
        }
      })
      groups.value = Array.from(uniqueGroups)
    }

    // Загрузка специальностей из коллекции specialties
    try {
      const specialtiesSnapshot = await getDocs(collection(db, 'specialties'))
      specialties.value = specialtiesSnapshot.docs
        .map(doc => doc.data().name)
        .filter(name => name && name.trim() !== '')
      console.log('Загружено специальностей из коллекции:', specialties.value)
    } catch (error) {
      console.log('Коллекция specialties не найдена, извлекаем специальности из проектов')
      const uniqueSpecialties = new Set<string>()
      projects.value.forEach(project => {
        if (project.specialty && project.specialty.trim() !== '') {
          uniqueSpecialties.add(project.specialty)
        }
      })
      specialties.value = Array.from(uniqueSpecialties)
    }

    // Извлекаем типы проектов из самих проектов
    const uniqueTypes = new Set<string>()
    projects.value.forEach(project => {
      if (project.type && project.type.trim() !== '') {
        uniqueTypes.add(project.type)
      }
    })
    projectTypes.value = Array.from(uniqueTypes)
    
    console.log('Уникальные группы:', groups.value)
    console.log('Уникальные специальности:', specialties.value)
    console.log('Уникальные типы проектов:', projectTypes.value)

  } catch (error) {
    console.error('Ошибка загрузки данных:', error)
  } finally {
    isLoading.value = false
  }
}

// Улучшенная функция поиска с фильтрами пользователя
const filteredProjects = computed(() => {
  if (!projects.value.length) return []
  
  const searchTerm = searchQuery.value.toLowerCase().trim()
  
  return projects.value.filter(project => {
    // Поиск по нескольким полям
    const matchesSearch = searchTerm === '' || 
      (project.title && project.title.toLowerCase().includes(searchTerm)) ||
      (project.authorName && project.authorName.toLowerCase().includes(searchTerm)) ||
      (project.group && project.group.toLowerCase().includes(searchTerm)) ||
      (project.description && project.description.toLowerCase().includes(searchTerm)) ||
      (project.specialty && project.specialty.toLowerCase().includes(searchTerm))
    
    // Фильтрация по группе
    const matchesGroup = selectedGroup.value === '' || 
      (project.group === selectedGroup.value)
    
    // Фильтрация по специальности
    const matchesSpecialty = selectedSpecialty.value === '' || 
      (project.specialty === selectedSpecialty.value)
    
    // Фильтрация по типу проекта
    const matchesProjectType = selectedProjectType.value === '' || 
      (project.type === selectedProjectType.value)
    
    // Фильтрация по группам пользователя
    const matchesUserGroups = !showOnlyMyGroups.value || 
      (userGroups.value.length > 0 && project.group && userGroups.value.includes(project.group))
    
    // Фильтрация по специальностям пользователя
    const matchesUserSpecialties = !showOnlyMySpecialties.value || 
      (userSpecialties.value.length > 0 && project.specialty && userSpecialties.value.includes(project.specialty))
    
    return matchesSearch && matchesGroup && matchesSpecialty && 
           matchesProjectType && matchesUserGroups && matchesUserSpecialties
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
  showOnlyMyGroups.value = false
  showOnlyMySpecialties.value = false
}

// Автоматическое применение фильтров пользователя при их изменении
watch([showOnlyMyGroups, showOnlyMySpecialties], ([newShowGroups, newShowSpecialties]) => {
  if (newShowGroups && userGroups.value.length > 0 && selectedGroup.value === '') {
    selectedGroup.value = userGroups.value[0]
  }
  
  if (newShowSpecialties && userSpecialties.value.length > 0 && selectedSpecialty.value === '') {
    selectedSpecialty.value = userSpecialties.value[0]
  }
})

onMounted(() => {
  console.log('Компонент Home mounted')
  loadData()
  
  // Слушатель изменения статуса аутентификации
  onAuthStateChanged(auth, (user) => {
    console.log('Статус аутентификации изменен:', user)
    if (user) {
      loadUserData(user.uid)
    } else {
      userGroups.value = []
      userSpecialties.value = []
      showOnlyMyGroups.value = false
      showOnlyMySpecialties.value = false
    }
  })
})
</script>

<template>
  <Header/>
  <main class="home-page">
    <!-- Баннер с названием -->
    <section class="banner">
      <h1 class="banner__title">Портфолио МВЕК</h1>
    </section>

    <!-- Поисковая строка с фильтрами -->
    <section class="search-section">
      <div class="search-container">
        <input 
          v-model="searchQuery"
          type="text" 
          class="search-input" 
          placeholder="Поиск по имени, группе, проекту или описанию..."
        />
        <button @click="clearFilters" class="clear-button">Сбросить</button>
      </div>
      
      <!-- Фильтры пользователя -->
      <div class="user-filters" v-if="userGroups.length > 0 || userSpecialties.length > 0">
        <label class="filter-checkbox">
          <input 
            type="checkbox" 
            v-model="showOnlyMyGroups" 
            :disabled="userGroups.length === 0"
          />
          Только мои группы
          <span v-if="userGroups.length > 0">({{ userGroups.join(', ') }})</span>
          <span v-else class="disabled-text">(не указаны)</span>
        </label>
        
        <label class="filter-checkbox">
          <input 
            type="checkbox" 
            v-model="showOnlyMySpecialties" 
            :disabled="userSpecialties.length === 0"
          />
          Только мои специальности
          <span v-if="userSpecialties.length > 0">({{ userSpecialties.join(', ') }})</span>
          <span v-else class="disabled-text">(не указаны)</span>
        </label>
      </div>
      
      <div class="filters">
        <select v-model="selectedGroup" class="filter-select" :disabled="showOnlyMyGroups && userGroups.length > 0">
          <option value="">Все группы</option>
          <option v-for="group in groups" :key="group" :value="group">{{ group }}</option>
        </select>
        
        <select v-model="selectedSpecialty" class="filter-select" :disabled="showOnlyMySpecialties && userSpecialties.length > 0">
          <option value="">Все специальности</option>
          <option v-for="specialty in specialties" :key="specialty" :value="specialty">{{ specialty }}</option>
        </select>
        
        <select v-model="selectedProjectType" class="filter-select">
          <option value="">Все типы проектов</option>
          <option v-for="type in projectTypes" :key="type" :value="type">{{ type }}</option>
        </select>
      </div>
      
      <!-- Информация о результатах -->
      <div class="results-info" v-if="projects.length">
        <p>Найдено проектов: {{ filteredProjects.length }} из {{ projects.length }}</p>
        <p v-if="showOnlyMyGroups" class="filter-info">Фильтр: Мои группы</p>
        <p v-if="showOnlyMySpecialties" class="filter-info">Фильтр: Мои специальности</p>
      </div>
    </section>

    <!-- Лучшие работы -->
    <section class="featured-works">
      <h2 class="section-title">Лучшие работы</h2>
      
      <div v-if="isLoading" class="loading">Загрузка проектов...</div>
      
      <div v-else-if="!projects.length" class="no-results">
        <p>Проекты не найдены. Проверьте подключение к Firebase.</p>
        <button @click="loadData" class="clear-button">Попробовать снова</button>
      </div>
      
      <div v-else-if="!filteredProjects.length" class="no-results">
        <p>Проекты не найдены. Попробуйте изменить параметры поиска.</p>
        <button @click="clearFilters" class="clear-button">Сбросить фильтры</button>
      </div>
      
      <div v-else class="works-grid">
        <ProjectCard 
          v-for="project in filteredProjects" 
          :key="project.id"
          :project="project"
          @click="goToProjectDetail(project.id)"
        />
      </div>
    </section>
  </main>
  <Footer/>
</template>

<style scoped>
@import "./home.scss";
</style>

<style scoped>
.back-button-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 2rem;
}

.back-button {
  padding: 0.5rem 1rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.3s ease;
}

.back-button:hover {
  background: #5a6fd8;
}

/* Добавляем стили для disabled кнопок */
.star-btn.disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.star-btn.disabled:hover {
  transform: none;
}

.rating-info {
  margin-top: 0.5rem;
  color: #666;
  font-size: 0.9rem;
}

.comment-like.liked {
  color: #ff4757;
}

.comment-like.liked:hover {
  color: #ff3742;
}

/* Улучшаем отображение комментариев */
.comments-list {
  margin-top: 1rem;
}

.comment-item {
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  background: #fafafa;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.comment-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.comment-user {
  display: flex;
  flex-direction: column;
}

.comment-user strong {
  font-size: 0.9rem;
}

.comment-date {
  font-size: 0.8rem;
  color: #666;
}

.comment-text {
  margin: 0;
  line-height: 1.4;
}

.comment-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 0.5rem;
}
/* Добавляем стили для disabled кнопок */
.star-btn.disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.star-btn.disabled:hover {
  transform: none;
}

.rating-info {
  margin-top: 0.5rem;
  color: #666;
  font-size: 0.9rem;
}

.comment-like.liked {
  color: #ff4757;
}

.comment-like.liked:hover {
  color: #ff3742;
}

/* Остальные стили остаются без изменений */
</style>
<style scoped lang="scss">
@import "./projectDetails.scss";
</style>