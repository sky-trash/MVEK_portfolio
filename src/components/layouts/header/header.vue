<script setup lang="ts">
import { ref } from 'vue';

const isMobileMenuOpen = ref(false);
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

      <!-- Кнопки входа/регистрации -->
      <div class="auth-buttons">
        <router-link to="/auth" class="auth-button login-button">Войти</router-link>
        <router-link to="/register" class="auth-button register-button">Регистрация</router-link>
      </div>

      <!-- Мобильное меню (бургер) -->
      <button 
        class="mobile-menu-button"
        @click="isMobileMenuOpen = !isMobileMenuOpen"
      >
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
            <router-link to="/teacher" class="mobile-nav-link">Преподаватели</router-link>
          </li>
          <li class="mobile-nav-item">
            <router-link to="/auth" class="mobile-nav-link">Войти</router-link>
          </li>
          <li class="mobile-nav-item">
            <router-link to="/register" class="mobile-nav-link">Регистрация</router-link>
          </li>
        </ul>
      </div>
    </transition>
  </header>
</template>
<style scoped>
@import "./header.scss";
</style>