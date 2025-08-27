<script setup lang="ts">
import Header from '../layouts/header/header.vue';
import Footer from '../layouts/footer/footer.vue';
import { ref, computed, onMounted } from 'vue';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/firebase';

interface Teacher {
  id: string;
  name: string;
  position: string;
  department: string;
  experience: string;
  groups: string[];
  subjects: string[];
  avatar: string;
  bio: string;
  email: string;
  phone: string;
  social: {
    vk?: string;
    telegram?: string;
    behance?: string;
    dribbble?: string;
  };
}

const teachers = ref<Teacher[]>([]);

// Фильтры
const searchQuery = ref('');
const selectedDepartment = ref('all');
const selectedSubject = ref('all');
const sortBy = ref('name');

// Получение преподавателей из базы данных
const fetchTeachers = async () => {
  try {
    isLoading.value = true;
    
    // Запрос к коллекции users с фильтрацией по роли teacher
    const usersQuery = query(
      collection(db, 'users'),
      where('role', '==', 'teacher')
    );
    
    const querySnapshot = await getDocs(usersQuery);
    const teachersData: Teacher[] = [];
    
    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      
      // Преобразование данных из Firestore в формат Teacher
      const teacher: Teacher = {
        id: doc.id,
        name: userData.name || userData.login || 'Не указано',
        position: userData.position || 'Преподаватель',
        department: userData.department || 'Кафедра не указана',
        experience: userData.experience || 'Не указан',
        groups: userData.groups || [],
        subjects: userData.subjects || [],
        avatar: userData.avatarUrl || `https://via.placeholder.com/300x300?text=Teacher`,
        bio: userData.bio || 'Информация о преподавателе',
        email: userData.email || '',
        phone: userData.phone || '+7 (XXX) XXX-XX-XX',
        social: {
          vk: userData.socialLinks?.vk || '',
          telegram: userData.socialLinks?.telegram || '',
          behance: userData.socialLinks?.behance || '',
          dribbble: userData.socialLinks?.dribbble || ''
        }
      };
      
      teachersData.push(teacher);
    });
    
    teachers.value = teachersData;
  } catch (error) {
    console.error('Ошибка при загрузке преподавателей:', error);
  } finally {
    isLoading.value = false;
  }
};

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

// Загрузка данных
const isLoading = ref(true);
onMounted(() => {
  fetchTeachers();
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
          <router-link :to="`/teacherProfile/${teacher.id}`" class="teacher-link">
            <div class="teacher-avatar">
              <img src="../../../public/logo.png" class="avatar-image">
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