<script setup lang="ts">
import Header from '../layouts/header/header.vue';
import Footer from '../layouts/footer/footer.vue';
import { ref, onMounted, computed } from 'vue';

// Моковые данные студентов (в реальном проекте будет API-запрос)
const students = ref([
  {
    id: 1,
    name: 'Иванова Анна',
    group: 'ДИ-21',
    specialty: 'Графический дизайн',
    avatar: 'https://via.placeholder.com/150',
    projectsCount: 12,
    rating: 4.7
  },
  {
    id: 2,
    name: 'Петров Максим',
    group: 'ДИ-22',
    specialty: 'Веб-дизайн',
    avatar: 'https://via.placeholder.com/150',
    projectsCount: 8,
    rating: 4.5
  },
  {
    id: 3,
    name: 'Сидорова Елена',
    group: 'ДИ-21',
    specialty: 'Промышленный дизайн',
    avatar: 'https://via.placeholder.com/150',
    projectsCount: 15,
    rating: 4.9
  },
  {
    id: 4,
    name: 'Козлов Дмитрий',
    group: 'ДИ-23',
    specialty: 'Дизайн интерьера',
    avatar: 'https://via.placeholder.com/150',
    projectsCount: 6,
    rating: 4.3
  },
  {
    id: 5,
    name: 'Федорова Ольга',
    group: 'ДИ-22',
    specialty: 'Графический дизайн',
    avatar: 'https://via.placeholder.com/150',
    projectsCount: 10,
    rating: 4.6
  },
  {
    id: 6,
    name: 'Николаев Артем',
    group: 'ДИ-24',
    specialty: 'Веб-дизайн',
    avatar: 'https://via.placeholder.com/150',
    projectsCount: 7,
    rating: 4.4
  }
]);

const isLoading = ref(true);
const searchQuery = ref('');
const selectedGroup = ref('all');
const selectedSpecialty = ref('all');

// Фильтрация студентов
const filteredStudents = computed(() => {
  return students.value.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchesGroup = selectedGroup.value === 'all' || student.group === selectedGroup.value;
    const matchesSpecialty = selectedSpecialty.value === 'all' || student.specialty === selectedSpecialty.value;
    
    return matchesSearch && matchesGroup && matchesSpecialty;
  });
});

// Получение уникальных групп и специальностей для фильтров
const groups = computed(() => {
  const uniqueGroups = new Set(students.value.map(student => student.group));
  return ['all', ...uniqueGroups];
});

const specialties = computed(() => {
  const uniqueSpecialties = new Set(students.value.map(student => student.specialty));
  return ['all', ...uniqueSpecialties];
});

// Имитация загрузки данных
onMounted(() => {
  setTimeout(() => {
    isLoading.value = false;
  }, 800);
});
</script>

<template>
  <Header/>
  <main class="students-page">
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
    </div>

    <div class="page-header">
      <h1>Студенты</h1>
      <p>Список студентов-дизайнеров колледжа</p>
    </div>

    <div class="filters-container">
      <div class="search-box">
        <input 
          v-model="searchQuery"
          type="text" 
          placeholder="Поиск по имени..."
          class="search-input"
        >
        <i class="fas fa-search"></i>
      </div>

      <div class="filter-group">
        <label class="filter-label">Группа:</label>
        <select v-model="selectedGroup" class="filter-select">
          <option 
            v-for="group in groups" 
            :key="group" 
            :value="group"
          >
            {{ group === 'all' ? 'Все группы' : group }}
          </option>
        </select>
      </div>

      <div class="filter-group">
        <label class="filter-label">Специальность:</label>
        <select v-model="selectedSpecialty" class="filter-select">
          <option 
            v-for="specialty in specialties" 
            :key="specialty" 
            :value="specialty"
          >
            {{ specialty === 'all' ? 'Все специальности' : specialty }}
          </option>
        </select>
      </div>
    </div>

    <div v-if="filteredStudents.length > 0" class="students-grid">
      <div 
        v-for="student in filteredStudents" 
        :key="student.id" 
        class="student-card"
      >
        <router-link :to="`/profile/${student.id}`" class="student-link">
          <div class="student-avatar">
            <img :src="student.avatar" :alt="student.name" class="avatar-image">
            <div class="student-rating">
              <i class="fas fa-star"></i>
              {{ student.rating }}
            </div>
          </div>
          <div class="student-info">
            <h3 class="student-name">{{ student.name }}</h3>
            <p class="student-group">{{ student.group }}</p>
            <p class="student-specialty">{{ student.specialty }}</p>
            <p class="student-projects">Проектов: {{ student.projectsCount }}</p>
          </div>
        </router-link>
      </div>
    </div>

    <div v-else class="empty-state">
      <i class="fas fa-user-graduate"></i>
      <p>Студенты не найдены</p>
    </div>
  </main>
  <Footer/>
</template>
<style scoped>
@import "./students.scss";
</style>