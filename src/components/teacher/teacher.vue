<script setup lang="ts">
import Header from '../layouts/header/header.vue';
import Footer from '../layouts/footer/footer.vue';
import { ref, computed, onMounted } from 'vue';

// Моковые данные преподавателей
const teachers = ref([
  {
    id: 1,
    name: 'Смирнова Ольга Васильевна',
    position: 'Преподаватель графического дизайна',
    department: 'Кафедра графического дизайна',
    experience: '15 лет',
    groups: ['ДИ-21', 'ДИ-22', 'ДИ-31'],
    subjects: ['Типографика', 'Бренд-дизайн', 'Композиция'],
    avatar: 'https://via.placeholder.com/300x300?text=Teacher+1',
    bio: 'Специалист в области графического дизайна с большим опытом работы в ведущих дизайн-студиях. Автор методических пособий по типографике.',
    email: 'o.smirnova@mvek.edu',
    phone: '+7 (495) 111-22-33',
    social: {
      vk: 'https://vk.com/teacher1',
      telegram: 'https://t.me/teacher1'
    }
  },
  {
    id: 2,
    name: 'Иванов Алексей Петрович',
    position: 'Преподаватель веб-дизайна',
    department: 'Кафедра цифрового дизайна',
    experience: '10 лет',
    groups: ['ДИ-22', 'ДИ-23', 'ДИ-32'],
    subjects: ['UI/UX дизайн', 'Прототипирование', 'Figma'],
    avatar: 'https://via.placeholder.com/300x300?text=Teacher+2',
    bio: 'Практикующий веб-дизайнер, участник международных конференций. Специализируется на создании пользовательских интерфейсов.',
    email: 'a.ivanov@mvek.edu',
    phone: '+7 (495) 222-33-44',
    social: {
      behance: 'https://behance.net/teacher2',
      dribbble: 'https://dribbble.com/teacher2'
    }
  },
  // ... другие преподаватели
]);

// Фильтры
const searchQuery = ref('');
const selectedDepartment = ref('all');
const selectedSubject = ref('all');
const sortBy = ref('name');

// Получение уникальных значений для фильтров
const departments = computed(() => {
  const deps = new Set(teachers.value.map(t => t.department));
  return ['all', ...deps];
});

const subjects = computed(() => {
  const subjs = new Set(teachers.value.flatMap(t => t.subjects));
  return ['all', ...subjs];
});

// Фильтрация и сортировка преподавателей
const filteredTeachers = computed(() => {
  let result = [...teachers.value];
  
  // Фильтрация по поиску
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(t => 
      t.name.toLowerCase().includes(query) || 
      t.position.toLowerCase().includes(query) ||
      t.subjects.some(s => s.toLowerCase().includes(query))
    );
  }
  
  // Фильтрация по кафедре
  if (selectedDepartment.value !== 'all') {
    result = result.filter(t => t.department === selectedDepartment.value);
  }
  
  // Фильтрация по предмету
  if (selectedSubject.value !== 'all') {
    result = result.filter(t => t.subjects.includes(selectedSubject.value));
  }
  
  // Сортировка
  if (sortBy.value === 'name') {
    result.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortBy.value === 'experience') {
    result.sort((a, b) => parseInt(b.experience) - parseInt(a.experience));
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
  <main class="teachers-page">
    <div class="container">
      <!-- Заголовок страницы -->
      <section class="page-header">
        <h1>Преподаватели</h1>
        <p>Наши опытные преподаватели и наставники</p>
      </section>

      <!-- Фильтры и сортировка -->
      <div class="teachers-filters">
        <div class="search-box">
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="Поиск преподавателей..."
            class="search-input"
          >
          <i class="fas fa-search"></i>
        </div>

        <div class="filter-row">
          <div class="filter-group">
            <label>Кафедра:</label>
            <select v-model="selectedDepartment" class="filter-select">
              <option value="all">Все кафедры</option>
              <option 
                v-for="department in departments" 
                :key="department" 
                :value="department"
                v-if="department !== 'all'"
              >
                {{ department }}
              </option>
            </select>
          </div>

          <div class="filter-group">
            <label>Предмет:</label>
            <select v-model="selectedSubject" class="filter-select">
              <option value="all">Все предметы</option>
              <option 
                v-for="subject in subjects" 
                :key="subject" 
                :value="subject"
                v-if="subject !== 'all'"
              >
                {{ subject }}
              </option>
            </select>
          </div>

          <div class="filter-group">
            <label>Сортировка:</label>
            <select v-model="sortBy" class="filter-select">
              <option value="name">По фамилии</option>
              <option value="experience">По стажу</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Список преподавателей -->
      <div v-if="isLoading" class="loading-spinner-container">
        <div class="loading-spinner"></div>
      </div>

      <div v-else-if="filteredTeachers.length > 0" class="teachers-grid">
        <div 
          v-for="teacher in filteredTeachers" 
          :key="teacher.id" 
          class="teacher-card"
        >
          <router-link :to="`/teacher/${teacher.id}`" class="teacher-link">
            <div class="teacher-avatar">
              <img :src="teacher.avatar" :alt="teacher.name" class="avatar-image">
            </div>
            <div class="teacher-info">
              <h3 class="teacher-name">{{ teacher.name }}</h3>
              <p class="teacher-position">{{ teacher.position }}</p>
              <div class="teacher-department">
                <i class="fas fa-university"></i>
                {{ teacher.department }}
              </div>
              <div class="teacher-experience">
                <i class="fas fa-briefcase"></i>
                Стаж: {{ teacher.experience }}
              </div>
              <div class="teacher-subjects">
                <i class="fas fa-book"></i>
                <div class="subjects-list">
                  <span v-for="subject in teacher.subjects" :key="subject" class="subject-tag">
                    {{ subject }}
                  </span>
                </div>
              </div>
            </div>
          </router-link>
          <div class="teacher-contacts">
            <a :href="`mailto:${teacher.email}`" class="contact-link">
              <i class="fas fa-envelope"></i>
              {{ teacher.email }}
            </a>
            <a :href="`tel:${teacher.phone}`" class="contact-link">
              <i class="fas fa-phone-alt"></i>
              {{ teacher.phone }}
            </a>
            <div class="social-links">
              <a 
                v-if="teacher.social.vk" 
                :href="teacher.social.vk" 
                target="_blank"
                class="social-link"
              >
                <i class="fab fa-vk"></i>
              </a>
              <a 
                v-if="teacher.social.telegram" 
                :href="teacher.social.telegram" 
                target="_blank"
                class="social-link"
              >
                <i class="fab fa-telegram"></i>
              </a>
              <a 
                v-if="teacher.social.behance" 
                :href="teacher.social.behance" 
                target="_blank"
                class="social-link"
              >
                <i class="fab fa-behance"></i>
              </a>
              <a 
                v-if="teacher.social.dribbble" 
                :href="teacher.social.dribbble" 
                target="_blank"
                class="social-link"
              >
                <i class="fab fa-dribbble"></i>
              </a>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <i class="fas fa-user-graduate"></i>
        <p>Преподаватели не найдены</p>
        <button 
          @click="
            searchQuery = '';
            selectedDepartment = 'all';
            selectedSubject = 'all';
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
@import "./teacher.scss";
</style>