<script setup lang="ts">
import Header from '../layouts/header/header.vue';
import Footer from '../layouts/footer/footer.vue';
import { ref, computed, onMounted } from 'vue';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/firebase.ts';

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

// Функция для правильного склонения слова "год"
const getExperienceText = (experience: string | number): string => {
  const exp = typeof experience === 'string' ? parseInt(experience) || 0 : experience;
  
  if (exp === 1) {
    return 'год';
  } else if (exp >= 2 && exp <= 4) {
    return 'года';
  } else {
    return 'лет';
  }
};

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
      
      // Преобразуем subjects в массив, если это строка
      let subjectsArray: string[] = [];
      if (Array.isArray(userData.subjects)) {
        subjectsArray = userData.subjects;
      } else if (typeof userData.subjects === 'string') {
        subjectsArray = [userData.subjects];
      } else if (userData.specialization) {
        // Если есть specialization, используем его
        if (Array.isArray(userData.specialization)) {
          subjectsArray = userData.specialization;
        } else if (typeof userData.specialization === 'string') {
          subjectsArray = [userData.specialization];
        }
      }
      
      // Преобразование данных из Firestore в формат Teacher
      const teacher: Teacher = {
        id: doc.id,
        name: userData.name || userData.login || 'Не указано',
        position: userData.position || 'Преподаватель',
        department: userData.department || 'Кафедра не указана',
        experience: userData.experience || '0',
        groups: userData.groups || [],
        subjects: subjectsArray,
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
  return [...deps].filter(dep => dep && dep !== 'all' && dep !== 'Кафедра не указана');
});

const subjects = computed(() => {
  // Получаем все предметы/специализации из профилей преподавателей
  const allSubjects = teachers.value.flatMap(t => t.subjects);
  
  // Фильтруем пустые значения, дубликаты и сортируем по алфавиту
  const uniqueSubjects = [...new Set(allSubjects)]
    .filter(subj => subj && subj.trim() !== '')
    .sort((a, b) => a.localeCompare(b));
  
  return uniqueSubjects;
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
      (t.subjects && t.subjects.some(s => s.toLowerCase().includes(query)))
    );
  }
  
  // Фильтрация по кафедре
  if (selectedDepartment.value !== 'all') {
    result = result.filter(t => t.department === selectedDepartment.value);
  }
  
  // Фильтрация по предмету/специализации
  if (selectedSubject.value !== 'all') {
    result = result.filter(t => 
      t.subjects && t.subjects.some(subject => 
        subject.toLowerCase().includes(selectedSubject.value.toLowerCase())
      )
    );
  }
  
  // Сортировка
  if (sortBy.value === 'name') {
    result.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortBy.value === 'experience') {
    result.sort((a, b) => {
      const expA = parseInt(a.experience) || 0;
      const expB = parseInt(b.experience) || 0;
      return expB - expA;
    });
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
              >
                {{ department }}
              </option>
            </select>
          </div>

          <div class="filter-group">
            <label>Специализация:</label>
            <select v-model="selectedSubject" class="filter-select">
              <option value="all">Все специализации</option>
              <option 
                v-for="subject in subjects" 
                :key="subject" 
                :value="subject"
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
                Стаж: {{ teacher.experience }} {{ getExperienceText(teacher.experience) }}
              </div>
              <div class="teacher-subjects" v-if="teacher.subjects && teacher.subjects.length > 0">
                <i class="fas fa-book"></i>
                <div class="subjects-text">
                  {{ teacher.subjects.join(', ') }}
                </div>
              </div>
            </div>
          </router-link>
          <div class="teacher-contacts">
            <a v-if="teacher.email" :href="`mailto:${teacher.email}`" class="contact-link">
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