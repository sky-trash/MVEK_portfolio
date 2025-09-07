<script setup lang="ts">
import Header from '../layouts/header/header.vue';
import Footer from '../layouts/footer/footer.vue';
import { ref, onMounted, computed } from 'vue';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';

interface Student {
  id: string;
  name: string;
  lname: string;
  login: string;
  group: string;
  avatarUrl: string;
  avatarBase64?: string; // Добавляем поле для base64 аватарки
  bio?: string;
  email: string;
  createdAt: string;
  projectIds: string[];
  role?: string;
  rating?: number;
}

interface UserInteraction {
  userId: string;
  likes: number;
  views: number;
  comments: number;
}

const students = ref<Student[]>([]);
const userInteractions = ref<Map<string, UserInteraction>>(new Map());
const isLoading = ref(true);
const searchQuery = ref('');
const selectedGroup = ref('all');

// Функция для получения URL аватарки
const getAvatarUrl = (student: Student): string => {
  // Приоритет: base64 → avatarUrl → дефолтная аватарка
  if (student.avatarBase64) {
    return student.avatarBase64;
  }
  if (student.avatarUrl && student.avatarUrl !== '@/public/logo.png') {
    return student.avatarUrl;
  }
  return '/logo.png'; // Дефолтная аватарка из public
};

// Загрузка студентов из Firestore (только с ролью student)
const loadStudents = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'users'));
    const studentsData: Student[] = [];

    for (const docSnapshot of querySnapshot.docs) {
      const data = docSnapshot.data();

      // Проверяем роль пользователя - только студенты
      if (data.role === 'student') {
        studentsData.push({
          id: docSnapshot.id,
          name: data.name || '',
          lname: data.lname || '',
          login: data.login || '',
          group: data.group || '',
          avatarUrl: data.avatarUrl || '',
          avatarBase64: data.avatarBase64 || '', // Добавляем base64 аватарку
          bio: data.bio || '',
          email: data.email || '',
          createdAt: data.createdAt || '',
          projectIds: data.projectIds || [],
          role: data.role || 'student'
        });
      }
    }

    students.value = studentsData;
    await loadUserInteractions();
  } catch (error) {
    console.error('Ошибка загрузки студентов:', error);
  } finally {
    isLoading.value = false;
  }
};

// Загрузка данных о взаимодействиях пользователей
const loadUserInteractions = async () => {
  try {
    const interactionsMap = new Map<string, UserInteraction>();
    const querySnapshot = await getDocs(collection(db, 'userInteractions'));

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      interactionsMap.set(data.userId, {
        userId: data.userId,
        likes: data.likes || 0,
        views: data.views || 0,
        comments: data.comments || 0
      });
    });

    userInteractions.value = interactionsMap;
  } catch (error) {
    console.error('Ошибка загрузки взаимодействий:', error);
  }
};

// Расчет рейтинга на основе userInteractions
const getStudentRating = (student: Student): string => {
  const interaction = userInteractions.value.get(student.id);

  if (!interaction) {
    return '4.5'; // Рейтинг по умолчанию, если данных нет
  }

  // Формула расчета рейтинга на основе взаимодействий
  const { likes, views, comments } = interaction;
  const totalInteractions = likes + views * 0.1 + comments * 0.5;

  // Базовый рейтинг 4.0 + взвешенные взаимодействия (максимум до 5.0)
  let rating = 4.0 + (Math.min(totalInteractions, 100) / 100); // 100 взаимодействий = +1.0 к рейтингу

  return Math.min(rating, 5.0).toFixed(1);
};

// Фильтрация студентов
const filteredStudents = computed(() => {
  return students.value.filter(student => {
    const fullName = `${student.name} ${student.lname}`.toLowerCase();
    const firstName = student.name.toLowerCase();
    const lastName = student.lname.toLowerCase();
    const login = student.login.toLowerCase();
    const searchTerm = searchQuery.value.toLowerCase();

    const matchesSearch = fullName.includes(searchTerm) ||
      firstName.includes(searchTerm) ||
      lastName.includes(searchTerm) ||
      login.includes(searchTerm);
    const matchesGroup = selectedGroup.value === 'all' || student.group === selectedGroup.value;

    return matchesSearch && matchesGroup;
  });
});

// Получение уникальных групп для фильтра
const groups = computed(() => {
  const uniqueGroups = new Set(students.value.map(student => student.group));
  return ['all', ...uniqueGroups].filter(group => group);
});

// Получение количества проектов для студента
const getProjectsCount = (student: Student) => {
  return student.projectIds ? student.projectIds.length : 0;
};

onMounted(() => {
  loadStudents();
});
</script>

<template>
  <Header />
  <main class="students-page">
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
    </div>

    <div class="page-header">
      <h1>Студенты</h1>
      <p>Список студентов колледжа</p>
    </div>

    <div class="filters-container">
      <div class="search-box">
        <input v-model="searchQuery" type="text" placeholder="Поиск по имени, отчеству или логину..."
          class="search-input">
        <i class="fas fa-search"></i>
      </div>

      <div class="filter-group">
        <label class="filter-label">Группа:</label>
        <select v-model="selectedGroup" class="filter-select">
          <option v-for="group in groups" :key="group" :value="group">
            {{ group === 'all' ? 'Все группы' : group }}
          </option>
        </select>
      </div>
    </div>

    <div v-if="filteredStudents.length > 0" class="students-grid">
      <div v-for="student in filteredStudents" :key="student.id" class="student-card">
        <router-link :to="`/studentsProfile/${student.id}`" class="student-link">
          <div class="student-avatar">
            <img :src="getAvatarUrl(student)" :alt="student.name" class="avatar-image">
          </div>
          <div class="student-info">
            <h3 class="student-name">{{ student.name }} {{ student.lname }}</h3>
            <p class="student-group">{{ student.group }}</p>
            <p class="student-login">@{{ student.login }}</p>
            <p class="student-projects">Проектов: {{ getProjectsCount(student) }}</p>
          </div>
        </router-link>
      </div>
    </div>

    <div v-else class="empty-state">
      <i class="fas fa-user-graduate"></i>
      <p>Студенты не найдены</p>
    </div>
  </main>
  <Footer />
</template>
<style scoped>
@import "./students.scss";
</style>