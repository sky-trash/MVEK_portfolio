<script setup lang="ts">
import Header from '../layouts/header/header.vue';
import Footer from '../layouts/footer/footer.vue';
import { ref, computed, onMounted } from 'vue';

// Моковые данные проектов
const projects = ref([
  {
    id: 1,
    title: 'Брендинг кафе "Уют"',
    type: 'Графический дизайн',
    author: 'Иванова Анна',
    group: 'ДИ-21',
    date: '15.03.2024',
    views: 124,
    rating: 4.8,
    tags: ['Логотип', 'Фирменный стиль', 'Упаковка'],
    description: 'Полный брендбук для сети кофеен "Уют" включая логотип, фирменный стиль и упаковку.',
    coverImage: 'https://via.placeholder.com/800x500?text=Project+1',
    images: [
      'https://via.placeholder.com/800x400?text=Project+1+Image+1',
      'https://via.placeholder.com/400x800?text=Project+1+Image+2'
    ]
  },
  {
    id: 2,
    title: 'Мобильное приложение для фитнеса',
    type: 'UI/UX Design',
    author: 'Петров Максим',
    group: 'ДИ-22',
    date: '02.02.2024',
    views: 89,
    rating: 4.5,
    tags: ['Мобильное приложение', 'Прототипирование', 'Анимация'],
    description: 'Концепция и дизайн мобильного приложения для трекинга тренировок и питания.',
    coverImage: 'https://via.placeholder.com/800x500?text=Project+2',
    images: [
      'https://via.placeholder.com/800x400?text=Project+2+Image+1',
      'https://via.placeholder.com/400x800?text=Project+2+Image+2'
    ]
  },
  // ... другие проекты
]);

// Фильтры
const searchQuery = ref('');
const selectedType = ref('all');
const selectedGroup = ref('all');
const selectedTag = ref('all');
const sortBy = ref('date');

// Получение уникальных значений для фильтров
const projectTypes = computed(() => {
  const types = new Set(projects.value.map(p => p.type));
  return ['all', ...types];
});

const projectGroups = computed(() => {
  const groups = new Set(projects.value.map(p => p.group));
  return ['all', ...groups];
});

const projectTags = computed(() => {
  const tags = new Set(projects.value.flatMap(p => p.tags));
  return ['all', ...tags];
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
      p.author.toLowerCase().includes(query)
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
  
  // Фильтрация по тегу
  if (selectedTag.value !== 'all') {
    result = result.filter(p => p.tags.includes(selectedTag.value));
  }
  
  // Сортировка
  if (sortBy.value === 'date') {
    result.sort((a, b) => new Date(b.date) - new Date(a.date));
  } else if (sortBy.value === 'rating') {
    result.sort((a, b) => b.rating - a.rating);
  } else if (sortBy.value === 'views') {
    result.sort((a, b) => b.views - a.views);
  }
  
  return result;
});

// Загрузка данных (имитация API)
const isLoading = ref(true);
onMounted(() => {
  setTimeout(() => {
    isLoading.value = false;
  }, 800);
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
            placeholder="Поиск проектов..."
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
                v-if="type !== 'all'"
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
                v-if="group !== 'all'"
              >
                {{ group }}
              </option>
            </select>
          </div>

          <div class="filter-group">
            <label>Тег:</label>
            <select v-model="selectedTag" class="filter-select">
              <option value="all">Все теги</option>
              <option 
                v-for="tag in projectTags" 
                :key="tag" 
                :value="tag"
                v-if="tag !== 'all'"
              >
                {{ tag }}
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
                  <i class="fas fa-star"></i> {{ project.rating }}
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
                  <i class="fas fa-user"></i> {{ project.author }}
                </span>
                <span class="meta-item">
                  <i class="fas fa-users"></i> {{ project.group }}
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
            selectedTag = 'all';
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