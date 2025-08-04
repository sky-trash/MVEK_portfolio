<script setup lang="ts">
import Header from '../layouts/header/header.vue';
import Footer from '../layouts/footer/footer.vue';
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const userId = ref(route.params.id);

// Данные профиля
const profileData = ref({
  id: '',
  avatar: 'https://via.placeholder.com/150',
  nickname: 'design_student',
  fullName: 'Иванова Анна Сергеевна',
  group: 'ДИ-21',
  specialty: 'Графический дизайн',
  bio: 'Студентка 3 курса, увлекаюсь цифровой иллюстрацией и бренд-дизайном. Участник нескольких выставок колледжа.',
  email: 'anna.ivanova@mvek.edu',
  socialLinks: {
    behance: 'https://behance.net/anna_ivanova',
    dribbble: 'https://dribbble.com/anna_ivanova',
    vk: 'https://vk.com/anna_ivanova'
  },
  skills: ['Adobe Photoshop', 'Illustrator', 'Figma', 'InDesign', 'UI/UX Design'],
  projects: [
    {
      id: 1,
      title: 'Брендинг кафе "Уют"',
      type: 'Графический дизайн',
      date: '15.03.2024',
      views: 124,
      rating: 4.8,
      images: [
        'https://via.placeholder.com/800x400?text=Project+1',
        'https://via.placeholder.com/400x800?text=Project+1'
      ],
      description: 'Полный брендбук для сети кофеен "Уют" включая логотип, фирменный стиль и упаковку.'
    },
    {
      id: 2,
      title: 'Мобильное приложение для фитнеса',
      type: 'UI/UX Design',
      date: '02.02.2024',
      views: 89,
      rating: 4.5,
      images: [
        'https://via.placeholder.com/800x400?text=Project+2',
        'https://via.placeholder.com/400x800?text=Project+2'
      ],
      description: 'Концепция и дизайн мобильного приложения для трекинга тренировок и питания.'
    }
  ]
});

// Состояния
const isLoading = ref(true);
const activeTab = ref('projects');
const isEditing = ref(false);
const editedBio = ref('');

// Загрузка данных профиля (имитация API)
const loadProfileData = async () => {
  try {
    isLoading.value = true;
    // Здесь должен быть запрос к API
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // В реальном проекте данные будут приходить с сервера
    console.log(`Загружаем профиль пользователя ${userId.value}`);
    
  } catch (error) {
    console.error('Ошибка загрузки профиля:', error);
  } finally {
    isLoading.value = false;
  }
};

// Редактирование профиля
const startEditing = () => {
  editedBio.value = profileData.value.bio;
  isEditing.value = true;
};

const saveProfile = () => {
  profileData.value.bio = editedBio.value;
  isEditing.value = false;
  // Здесь должен быть запрос на сохранение
};

// Инициализация
onMounted(() => {
  loadProfileData();
});
</script>

<template>
  <Header/>
  <main class="profile-page">
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
    </div>

    <div class="profile-header">
      <div class="container">
        <div class="profile-avatar">
          <img :src="profileData.avatar" :alt="profileData.fullName" class="avatar-image">
          <div class="avatar-badge">Студент</div>
        </div>
        
        <div class="profile-info">
          <h1 class="profile-name">{{ profileData.fullName }}</h1>
          <p class="profile-nickname">@{{ profileData.nickname }}</p>
          
          <div class="profile-meta">
            <span class="meta-item">
              <i class="fas fa-users"></i> Группа: {{ profileData.group }}
            </span>
            <span class="meta-item">
              <i class="fas fa-graduation-cap"></i> {{ profileData.specialty }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="profile-content">
      <div class="container">
        <div class="profile-sidebar">
          <div class="profile-section">
            <h3 class="section-title">О себе</h3>
            <div v-if="!isEditing" class="profile-bio">
              <p>{{ profileData.bio }}</p>
              <button @click="startEditing" class="edit-button">
                <i class="fas fa-edit"></i> Редактировать
              </button>
            </div>
            <div v-else class="profile-bio-edit">
              <textarea v-model="editedBio" class="bio-textarea"></textarea>
              <div class="edit-actions">
                <button @click="saveProfile" class="save-button">Сохранить</button>
                <button @click="isEditing = false" class="cancel-button">Отмена</button>
              </div>
            </div>
          </div>

          <div class="profile-section">
            <h3 class="section-title">Навыки</h3>
            <div class="skills-list">
              <span v-for="(skill, index) in profileData.skills" :key="index" class="skill-tag">
                {{ skill }}
              </span>
            </div>
          </div>

          <div class="profile-section">
            <h3 class="section-title">Контакты</h3>
            <ul class="contact-list">
              <li>
                <i class="fas fa-envelope"></i>
                <a :href="`mailto:${profileData.email}`">{{ profileData.email }}</a>
              </li>
              <li v-if="profileData.socialLinks.behance">
                <i class="fab fa-behance"></i>
                <a :href="profileData.socialLinks.behance" target="_blank">Behance</a>
              </li>
              <li v-if="profileData.socialLinks.dribbble">
                <i class="fab fa-dribbble"></i>
                <a :href="profileData.socialLinks.dribbble" target="_blank">Dribbble</a>
              </li>
              <li v-if="profileData.socialLinks.vk">
                <i class="fab fa-vk"></i>
                <a :href="profileData.socialLinks.vk" target="_blank">ВКонтакте</a>
              </li>
            </ul>
          </div>
        </div>

        <div class="profile-main">
          <div class="profile-tabs">
            <button 
              @click="activeTab = 'projects'" 
              :class="{ 'active': activeTab === 'projects' }" 
              class="tab-button"
            >
              Проекты ({{ profileData.projects.length }})
            </button>
            <button 
              @click="activeTab = 'achievements'" 
              :class="{ 'active': activeTab === 'achievements' }" 
              class="tab-button"
            >
              Достижения
            </button>
            <button 
              @click="activeTab = 'activity'" 
              :class="{ 'active': activeTab === 'activity' }" 
              class="tab-button"
            >
              Активность
            </button>
          </div>

          <div v-if="activeTab === 'projects'" class="projects-grid">
            <div v-for="project in profileData.projects" :key="project.id" class="project-card">
              <router-link :to="`/project/${project.id}`" class="project-link">
                <div class="project-image-container">
                  <img :src="project.images[0]" :alt="project.title" class="project-image">
                  <div class="project-overlay">
                    <span class="project-rating">
                      <i class="fas fa-star"></i> {{ project.rating }}
                    </span>
                    <span class="project-views">
                      <i class="fas fa-eye"></i> {{ project.views }}
                    </span>
                  </div>
                </div>
                <div class="project-info">
                  <h3 class="project-title">{{ project.title }}</h3>
                  <p class="project-type">{{ project.type }}</p>
                  <p class="project-date">{{ project.date }}</p>
                </div>
              </router-link>
            </div>
          </div>

          <div v-if="activeTab === 'achievements'" class="achievements-section">
            <div class="empty-state">
              <i class="fas fa-trophy"></i>
              <p>Достижения скоро появятся</p>
            </div>
          </div>

          <div v-if="activeTab === 'activity'" class="activity-section">
            <div class="empty-state">
              <i class="fas fa-chart-line"></i>
              <p>Активность скоро появится</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
  <Footer/>
</template>
<style scoped>
@import "./profile.scss";
</style>