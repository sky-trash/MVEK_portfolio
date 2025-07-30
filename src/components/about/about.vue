<script setup lang="ts">
const collegeInfo = {
  name: "МВЕК Колледж",
  description: "Ведущее учебное заведение в области дизайна и визуальных искусств с многолетней историей и современным подходом к образованию.",
  founded: 1998,
  specialties: [
    "Графический дизайн",
    "UX/UI дизайн",
    "Промышленный дизайн",
    "Дизайн интерьеров",
    "Фотография"
  ],
  stats: {
    students: 1200,
    teachers: 85,
    graduates: 9500
  }
};

// Преимущества колледжа
const advantages = [
  {
    icon: "🎓",
    title: "Профессиональные преподаватели",
    description: "Наши преподаватели - практикующие специалисты с большим опытом работы"
  },
  {
    icon: "💻",
    title: "Современное оборудование",
    description: "Компьютерные классы с профессиональным ПО и современные мастерские"
  },
  {
    icon: "🏆",
    title: "Конкурсы и выставки",
    description: "Регулярное участие в профессиональных конкурсах и выставках"
  },
  {
    icon: "🤝",
    title: "Партнерские программы",
    description: "Сотрудничество с ведущими дизайн-студиями и компаниями"
  }
];
</script>

<template>
  <main class="about-page">
    <!-- Блок с основной информацией -->
    <section class="about-hero">
      <div class="container">
        <h1 class="page-title">О колледже МВЕК</h1>
        <p class="college-description">{{ collegeInfo.description }}</p>

        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-number">{{ collegeInfo.stats.students }}+</span>
            <span class="stat-label">Студентов</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ collegeInfo.stats.teachers }}+</span>
            <span class="stat-label">Преподавателей</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ collegeInfo.stats.graduates }}+</span>
            <span class="stat-label">Выпускников</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ new Date().getFullYear() - collegeInfo.founded }}</span>
            <span class="stat-label">Лет опыта</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Специальности -->
    <section class="specialties-section">
      <div class="container">
        <h2 class="section-title">Наши специальности</h2>
        <div class="specialties-grid">
          <div v-for="(specialty, index) in collegeInfo.specialties" :key="index" class="specialty-card">
            <span class="specialty-number">0{{ index + 1 }}</span>
            <h3 class="specialty-name">{{ specialty }}</h3>
          </div>
        </div>
      </div>
    </section>

    <!-- Преимущества -->
    <section class="advantages-section">
      <div class="container">
        <h2 class="section-title">Почему выбирают МВЕК</h2>
        <div class="advantages-grid">
          <div v-for="(advantage, index) in advantages" :key="index" class="advantage-card">
            <div class="advantage-icon">{{ advantage.icon }}</div>
            <h3 class="advantage-title">{{ advantage.title }}</h3>
            <p class="advantage-description">{{ advantage.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Ссылки на разделы портфолио -->
    <section class="portfolio-links">
      <div class="container">
        <h2 class="section-title">Наше портфолио</h2>
        <div class="links-grid">
          <router-link to="/students" class="portfolio-link">
            <span class="link-icon">👨‍🎓</span>
            <span class="link-text">Студенты</span>
          </router-link>
          <router-link to="/projects" class="portfolio-link">
            <span class="link-icon">🖼️</span>
            <span class="link-text">Проекты</span>
          </router-link>
          <router-link to="/teachers" class="portfolio-link">
            <span class="link-icon">👩‍🏫</span>
            <span class="link-text">Преподаватели</span>
          </router-link>
        </div>
      </div>
    </section>
  </main>
</template>
<style scoped>
@import "./about.scss";
</style>