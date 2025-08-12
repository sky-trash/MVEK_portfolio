<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/firebase';

const router = useRouter();
const isMobileMenuOpen = ref(false);
const isAuthenticated = ref(false);
const userEmail = ref('');

// Проверка состояния авторизации
onMounted(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    isAuthenticated.value = !!user;
    userEmail.value = user?.email || '';
  });
  return () => unsubscribe();
});

// Выход из системы
const handleLogout = async () => {
  try {
    await signOut(auth);
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authToken');
    router.push('/');
  } catch (error) {
    console.error('Logout error:', error);
  }
};
</script>

<template>
  <header class="site-header">
    <div class="header-container">
      <!-- Логотип -->
      <div class="logo">
        <router-link to="/">
          <img src="../../../../public/logo.png" alt="Логотип МВЕК" class="logo-img" />
        </router-link>
      </div>

      <!-- Основное меню навигации -->
      <nav class="main-nav">
        <ul class="nav-list">
          <li class="nav-item">
            <router-link to="/about" class="nav-link">О нас</router-link>
          </li>
          <li class="nav-item">
            <router-link to="/students" class="nav-link">Студенты</router-link>
          </li>
          <li class="nav-item">
            <router-link to="/projects" class="nav-link">Проекты</router-link>
          </li>
          <li class="nav-item">
            <router-link to="/teachers" class="nav-link">Преподаватели</router-link>
          </li>
        </ul>
      </nav>

      <!-- Кнопки в зависимости от авторизации -->
      <div class="auth-buttons" v-if="!isAuthenticated">
        <router-link to="/auth" class="auth-button login-button">Войти</router-link>
        <router-link to="/register" class="auth-button register-button">Регистрация</router-link>
      </div>

      <div class="auth-buttons" v-else>
        <router-link to="/profile" class="auth-button login-button">
          Профиль {{ userEmail }}
        </router-link>
        <router-link to="" @click="handleLogout" class="auth-button register-button">Выйти</router-link>
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
            <router-link to="/about" class="mobile-nav-link">О нас</router-link>
          </li>
          <li class="mobile-nav-item">
            <router-link to="/students" class="mobile-nav-link">Студенты</router-link>
          </li>
          <li class="mobile-nav-item">
            <router-link to="/projects" class="mobile-nav-link">Проекты</router-link>
          </li>
          <li class="mobile-nav-item">
            <router-link to="/teachers" class="mobile-nav-link">Преподаватели</router-link>
          </li>
          
          <template v-if="!isAuthenticated">
            <li class="mobile-nav-item">
              <router-link to="/auth" class="mobile-nav-link">Войти</router-link>
            </li>
            <li class="mobile-nav-item">
              <router-link to="/register" class="mobile-nav-link">Регистрация</router-link>
            </li>
          </template>
          <template v-else>
            <li class="mobile-nav-item">
              <router-link to="/profile" class="mobile-nav-link">Профиль</router-link>
            </li>
            <li class="mobile-nav-item">
              <router-link to="" @click="handleLogout" class="mobile-nav-link">Выйти</router-link>
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