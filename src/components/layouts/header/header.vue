<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, getDocs, where, collection, query } from 'firebase/firestore';
import { auth, db } from '@/firebase';

const router = useRouter();
const isMobileMenuOpen = ref(false);
const isAuthenticated = ref(false);
const userEmail = ref('');
const userRole = ref('');
const userId = ref('');

// Проверка состояния авторизации и получение роли пользователя
onMounted(() => {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    isAuthenticated.value = !!user;
    userEmail.value = user?.email || '';
    userId.value = user?.uid || ''; // Сохраняем ID пользователя

    if (user) {
      // Получаем роль пользователя из Firestore
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          userRole.value = userData.role || 'student';
          localStorage.setItem('userRole', userData.role || 'student');
        } else {
          // Если документ не найден, проверяем старую структуру
          const usersQuery = query(
            collection(db, 'users'),
            where('userId', '==', user.uid)
          );
          const querySnapshot = await getDocs(usersQuery);

          if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data();
            userRole.value = userData.role || 'student';
            localStorage.setItem('userRole', userData.role || 'student');
          } else {
            userRole.value = 'student';
            localStorage.setItem('userRole', 'student');
          }
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        userRole.value = 'student';
        localStorage.setItem('userRole', 'student');
      }
    } else {
      userRole.value = '';
      userId.value = '';
      localStorage.removeItem('userRole');
    }
  });
  return () => unsubscribe();
});

// Выход из системы
const handleLogout = async () => {
  try {
    await signOut(auth);
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    sessionStorage.removeItem('authToken');
    isMobileMenuOpen.value = false;
    router.push('/');
  } catch (error) {
    console.error('Logout error:', error);
  }
};

// Переход в профиль с проверкой роли
const goToProfile = () => {
  const role = userRole.value || localStorage.getItem('userRole');
  if (role === 'teacher') {
    // Для преподавателя используем базовый маршрут без ID
    router.push('/teacherProfile');
  } else {
    // Для студента также используем базовый маршрут
    router.push('/profile');
  }
  isMobileMenuOpen.value = false;
};

// Закрытие мобильного меню при клике на ссылку
const closeMobileMenu = () => {
  isMobileMenuOpen.value = false;
};
</script>

<template>
  <header class="site-header">
    <div class="header-container">
      <!-- Логотип -->
      <div class="logo">
        <router-link to="/" @click="closeMobileMenu">
          <img src="../../../../public/logo.png" alt="Логотип МВЕК" class="logo-img" />
        </router-link>
      </div>

      <!-- Основное меню навигации -->
      <nav class="main-nav">
        <ul class="nav-list">
          <li class="nav-item">
            <router-link to="/about" class="nav-link" @click="closeMobileMenu">О нас</router-link>
          </li>
          <li class="nav-item">
            <router-link to="/students" class="nav-link" @click="closeMobileMenu">Студенты</router-link>
          </li>
          <li class="nav-item">
            <router-link to="/projects" class="nav-link" @click="closeMobileMenu">Проекты</router-link>
          </li>
          <li class="nav-item">
            <router-link to="/teachers" class="nav-link" @click="closeMobileMenu">Преподаватели</router-link>
          </li>
        </ul>
      </nav>

      <!-- Кнопки в зависимости от авторизации -->
      <div class="auth-buttons" v-if="!isAuthenticated">
        <router-link to="/auth" class="auth-button login-button" @click="closeMobileMenu">Войти</router-link>
        <router-link to="/register" class="auth-button register-button"
          @click="closeMobileMenu">Регистрация</router-link>
      </div>

      <div class="auth-buttons" v-else>
        <button @click="goToProfile" class="auth-button login-button">
          Профиль ({{ userEmail }})
        </button>
        <button @click="handleLogout" class="auth-button register-button">Выйти</button>
      </div>

      <!-- Мобильное меню -->
      <button class="mobile-menu-button" @click="isMobileMenuOpen = !isMobileMenuOpen">
        <span class="burger-line"></span>
        <span class="burger-line"></span>
        <span class="burger-line"></span>
      </button>
    </div>

    <!-- Мобильное меню (выпадающее) -->
    <transition name="slide-down">
      <div class="mobile-menu" v-if="isMobileMenuOpen">
        <ul class="mobile-nav-list">
          <li class="mobile-nav-item">
            <router-link to="/about" class="mobile-nav-link" @click="closeMobileMenu">О нас</router-link>
          </li>
          <li class="mobile-nav-item">
            <router-link to="/students" class="mobile-nav-link" @click="closeMobileMenu">Студенты</router-link>
          </li>
          <li class="mobile-nav-item">
            <router-link to="/projects" class="mobile-nav-link" @click="closeMobileMenu">Проекты</router-link>
          </li>
          <li class="mobile-nav-item">
            <router-link to="/teachers" class="mobile-nav-link" @click="closeMobileMenu">Преподаватели</router-link>
          </li>

          <template v-if="!isAuthenticated">
            <li class="mobile-nav-item">
              <router-link to="/auth" class="mobile-nav-link" @click="closeMobileMenu">Войти</router-link>
            </li>
            <li class="mobile-nav-item">
              <router-link to="/register" class="mobile-nav-link" @click="closeMobileMenu">Регистрация</router-link>
            </li>
          </template>
          <template v-else>
            <li class="mobile-nav-item">
              <button @click="goToProfile" class="mobile-nav-link">
                Профиль
              </button>
            </li>
            <li class="mobile-nav-item">
              <button @click="handleLogout" class="mobile-nav-link logout-button">Выйти</button>
            </li>
          </template>
        </ul>
      </div>
    </transition>
  </header>
</template>
<style scoped>
@import "./header.scss";
</style>