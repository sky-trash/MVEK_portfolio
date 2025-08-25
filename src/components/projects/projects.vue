<script setup lang="ts">
import Header from '../layouts/header/header.vue';
import Footer from '../layouts/footer/footer.vue';
import { ref, computed, onMounted } from 'vue';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';

interface Project {
  id: string;
  title: string;
  type: string;
  authorId: string;
  authorName: string;
  authorLname: string;
  group: string;
  specialty: string;
  date: string;
  views: number;
  rating: number;
  tags: string[];
  description: string;
  coverImage: string;
  images: string[];
  createdAt: any;
}

interface User {
  id: string;
  name: string;
  lname: string;
  group: string;
  specialty: string;
  role: string;
}

const projects = ref<Project[]>([]);
const users = ref<Map<string, User>>(new Map());
const isLoading = ref(true);

// Фильтры
const searchQuery = ref('');
const selectedType = ref('all');
const selectedGroup = ref('all');
const selectedSpecialty = ref('all');
const sortBy = ref('date');

// Загрузка проектов из Firestore
const loadProjects = async () => {
  try {
    const projectsSnapshot = await getDocs(collection(db, 'projects'));
    const usersSnapshot = await getDocs(collection(db, 'users'));
    
    // Загружаем пользователей в Map для быстрого доступа
    const usersMap = new Map<string, User>();
    usersSnapshot.forEach((doc) => {
      const data = doc.data();
      usersMap.set(doc.id, {
        id: doc.id,
        name: data.name || '',
        lname: data.lname || '',
        group: data.group || 'Не указана',
        specialty: data.specialty || 'Не указана',
        role: data.role || ''
      });
    });
    
    users.value = usersMap;

    // Загружаем проекты
    const projectsData: Project[] = [];
    for (const docSnapshot of projectsSnapshot.docs) {
      const data = docSnapshot.data();
      const authorId = data.authorId || '';
      const author = usersMap.get(authorId);

      // Добавляем только проекты студентов
      if (author && author.role === 'student') {
        // Обработка даты создания
        let createdAtDate: Date;
        if (data.createdAt && typeof data.createdAt.toDate === 'function') {
          createdAtDate = data.createdAt.toDate();
        } else if (data.createdAt) {
          createdAtDate = new Date(data.createdAt);
        } else {
          createdAtDate = new Date();
        }

        projectsData.push({
          id: docSnapshot.id,
          title: data.title || 'Без названия',
          type: data.type || 'Не указан',
          authorId: authorId,
          authorName: author.name,
          authorLname: author.lname,
          group: author.group,
          specialty: author.specialty,
          date: createdAtDate.toLocaleDateString('ru-RU'),
          views: data.views || 0,
          rating: data.rating || 0,
          tags: data.tags || [],
          description: data.description || '',
          coverImage: data.coverImage || 'https://via.placeholder.com/800x500?text=Project',
          images: data.images || [],
          createdAt: createdAtDate
        });
      }
    }
    
    projects.value = projectsData;
  } catch (error) {
    console.error('Ошибка загрузки проектов:', error);
  } finally {
    isLoading.value = false;
  }
};

// Получение уникальных значений для фильтров
const projectTypes = computed(() => {
  const types = new Set(projects.value.map(p => p.type));
  return ['all', ...types].filter(type => type && type !== 'Не указан');
});

const projectGroups = computed(() => {
  const groups = new Set(projects.value.map(p => p.group));
  return ['all', ...groups].filter(group => group && group !== 'Не указана');
});

const projectSpecialties = computed(() => {
  const specialties = new Set(projects.value.map(p => p.specialty));
  return ['all', ...specialties].filter(specialty => specialty && specialty !== 'Не указана');
});

// Фильтрация и сортировка проектов
const filteredProjects = computed(() => {
  let result = [...projects.value];
  
  // Фильтрация по поиску
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(p => 
      p.title.toLowerCase().includes(query) || 
      p.description.toLowerCase().includes(query) ||
      `${p.authorName} ${p.authorLname}`.toLowerCase().includes(query) ||
      p.tags.some(tag => tag.toLowerCase().includes(query))
    );
  }
  
  // Фильтрация по типу
  if (selectedType.value !== 'all') {
    result = result.filter(p => p.type === selectedType.value);
  }
  
  // Фильтрация по группе
  if (selectedGroup.value !== 'all') {
    result = result.filter(p => p.group === selectedGroup.value);
  }
  
  // Фильтрация по специальности
  if (selectedSpecialty.value !== 'all') {
    result = result.filter(p => p.specialty === selectedSpecialty.value);
  }
  
  // Сортировка
  if (sortBy.value === 'date') {
    result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } else if (sortBy.value === 'rating') {
    result.sort((a, b) => b.rating - a.rating);
  } else if (sortBy.value === 'views') {
    result.sort((a, b) => b.views - a.views);
  }
  
  return result;
});

onMounted(() => {
  loadProjects();
});
</script>

<template>
  <Header/>
  <main class="projects-page">
    <div class="container">
      <!-- Заголовок страницы -->
      <section class="page-header">
        <h1>Проекты студентов</h1>
        <p>Лучшие работы студентов-дизайнеров колледжа</p>
      </section>

      <!-- Фильтры и сортировка -->
      <div class="projects-filters">
        <div class="search-box">
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="Поиск проектов, авторов или тегов..."
            class="search-input"
          >
          <i class="fas fa-search"></i>
        </div>

        <div class="filter-row">
          <div class="filter-group">
            <label>Тип проекта:</label>
            <select v-model="selectedType" class="filter-select">
              <option value="all">Все типы</option>
              <option 
                v-for="type in projectTypes" 
                :key="type" 
                :value="type"
              >
                {{ type }}
              </option>
            </select>
          </div>

          <div class="filter-group">
            <label>Группа:</label>
            <select v-model="selectedGroup" class="filter-select">
              <option value="all">Все группы</option>
              <option 
                v-for="group in projectGroups" 
                :key="group" 
                :value="group"
              >
                {{ group }}
              </option>
            </select>
          </div>

          <div class="filter-group">
            <label>Специальность:</label>
            <select v-model="selectedSpecialty" class="filter-select">
              <option value="all">Все специальности</option>
              <option 
                v-for="specialty in projectSpecialties" 
                :key="specialty" 
                :value="specialty"
              >
                {{ specialty }}
              </option>
            </select>
          </div>

          <div class="filter-group">
            <label>Сортировка:</label>
            <select v-model="sortBy" class="filter-select">
              <option value="date">По дате</option>
              <option value="rating">По рейтингу</option>
              <option value="views">По просмотрам</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Список проектов -->
      <div v-if="isLoading" class="loading-spinner-container">
        <div class="loading-spinner"></div>
      </div>

      <div v-else-if="filteredProjects.length > 0" class="projects-grid">
        <div 
          v-for="project in filteredProjects" 
          :key="project.id" 
          class="project-card"
        >
          <router-link :to="`/project/${project.id}`" class="project-link">
            <div class="project-image-container">
              <img :src="project.coverImage" :alt="project.title" class="project-image">
              <div class="project-overlay">
                <span class="project-rating">
                  <i class="fas fa-star"></i> {{ project.rating.toFixed(1) }}
                </span>
                <span class="project-views">
                  <i class="fas fa-eye"></i> {{ project.views }}
                </span>
              </div>
            </div>
            <div class="project-info">
              <h3 class="project-title">{{ project.title }}</h3>
              <p class="project-type">{{ project.type }}</p>
              <div class="project-meta">
                <span class="meta-item">
                  <i class="fas fa-user"></i> {{ project.authorName }} {{ project.authorLname }}
                </span>
                <span class="meta-item">
                  <i class="fas fa-users"></i> {{ project.group }}
                </span>
                <span class="meta-item">
                  <i class="fas fa-graduation-cap"></i> {{ project.specialty }}
                </span>
                <span class="meta-item">
                  <i class="fas fa-calendar-alt"></i> {{ project.date }}
                </span>
              </div>
              <div class="project-tags">
                <span 
                  v-for="tag in project.tags" 
                  :key="tag" 
                  class="tag"
                >
                  {{ tag }}
                </span>
              </div>
            </div>
          </router-link>
        </div>
      </div>

      <div v-else class="empty-state">
        <i class="fas fa-folder-open"></i>
        <p>Проекты не найдены</p>
        <button 
          @click="
            searchQuery = '';
            selectedType = 'all';
            selectedGroup = 'all';
            selectedSpecialty = 'all';
          " 
          class="reset-filters"
        >
          Сбросить фильтры
        </button>
      </div>
    </div>
  </main>
  <Footer/>
</template>
<style scoped>
@import "./projects.scss";
</style>