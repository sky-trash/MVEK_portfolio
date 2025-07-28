<script setup lang="ts">
import Header from '../layouts/header/header.vue';
import Footer from '../layouts/footer/footer.vue';
</script>

<template>
  <Header/>
  <main class="home-page">
    <!-- Баннер с названием -->
    <section class="banner">
      <h1 class="banner__title">Портфолио МВЕК</h1>
    </section>

    <!-- Поисковая строка с фильтрами -->
    <section class="search-section">
      <div class="search-container">
        <input 
          type="text" 
          class="search-input" 
          placeholder="Поиск по имени, группе или проекту..."
        />
        <button class="search-button">Найти</button>
      </div>
      <div class="filters">
        <select class="filter-select">
          <option value="">Все группы</option>
          <!-- Здесь будут динамические опции -->
        </select>
        <select class="filter-select">
          <option value="">Все специальности</option>
          <!-- Здесь будут динамические опции -->
        </select>
        <select class="filter-select">
          <option value="">Все типы проектов</option>
          <!-- Здесь будут динамические опции -->
        </select>
      </div>
    </section>

    <!-- Лучшие работы -->
    <section class="featured-works">
      <h2 class="section-title">Лучшие работы</h2>
      <div class="works-grid">
        <!-- Здесь будут карточки работ -->
        <div class="work-card" v-for="i in 4" :key="i">
          <div class="work-image"></div>
          <div class="work-info">
            <h3>Название проекта {{i}}</h3>
            <p>Автор: Студент {{i}}</p>
            <p>Группа: ДИЗ-{{i}}</p>
            <div class="rating">★ ★ ★ ★ ☆</div>
          </div>
        </div>
      </div>
    </section>
  </main>
  <Footer/>
</template>
<style scoped>
@import "./home.scss";
</style>