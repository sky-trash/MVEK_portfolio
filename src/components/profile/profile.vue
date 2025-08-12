<script setup lang="ts">
import Header from '../layouts/header/header.vue';
import Footer from '../layouts/footer/footer.vue';
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '@/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const route = useRoute();
const userId = ref(route.params.id || '');

// Данные профиля
const profileData = ref({
  id: '',
  avatar: 'https://via.placeholder.com/150',
  nickname: '',
  fullName: '',
  group: '',
  specialty: '',
  bio: '',
  email: '',
  socialLinks: {
    behance: '',
    dribbble: '',
    vk: ''
  },
  skills: [],
  projects: []
});

// Состояния
const isLoading = ref(true);
const activeTab = ref('projects');
const isEditing = ref(false);
const editedBio = ref('');
const currentUserId = ref('');
const errorMessage = ref('');

// Улучшенная функция поиска пользователя
const findUserDocument = async (identifier: string) => {
  try {
    // Пытаемся найти по document ID
    if (!identifier.includes('/')) {
      const docRef = doc(db, 'users', identifier);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) return docSnap;
    }

    // Если не нашли, ищем по полю userId
    const q1 = query(collection(db, 'users'), where('userId', '==', identifier));
    const querySnapshot1 = await getDocs(q1);
    if (!querySnapshot1.empty) return querySnapshot1.docs[0];

    // Если не нашли, ищем по email
    const q2 = query(collection(db, 'users'), where('email', '==', identifier));
    const querySnapshot2 = await getDocs(q2);
    if (!querySnapshot2.empty) return querySnapshot2.docs[0];

    // Если не нашли, ищем по login
    const q3 = query(collection(db, 'users'), where('login', '==', identifier));
    const querySnapshot3 = await getDocs(q3);
    if (!querySnapshot3.empty) return querySnapshot3.docs[0];

    return null;
  } catch (error) {
    console.error('Ошибка поиска пользователя:', error);
    return null;
  }
};

// Загрузка данных профиля
const loadProfileData = async () => {
  try {
    isLoading.value = true;
    errorMessage.value = '';
    
    const identifier = userId.value || currentUserId.value;
    if (!identifier) {
      errorMessage.value = 'Не указан идентификатор пользователя';
      return;
    }

    const userDoc = await findUserDocument(identifier);
    
    if (userDoc) {
      const userData = userDoc.data();
      
      // Формируем данные для отображения
      profileData.value = {
        id: userDoc.id,
        avatar: userData.avatarUrl || 'https://via.placeholder.com/150',
        nickname: userData.login || '',
        fullName: [userData.surname, userData.name, userData.lname].filter(Boolean).join(' ') || 'Не указано',
        group: userData.group || 'Не указана',
        specialty: userData.specialty || 'Не указана',
        bio: userData.bio || 'Пользователь пока не добавил информацию о себе',
        email: userData.email || '',
        socialLinks: {
          behance: userData.socialLinks?.behance || '',
          dribbble: userData.socialLinks?.dribbble || '',
          vk: userData.socialLinks?.vk || ''
        },
        skills: userData.skills || [],
        projects: userData.projects || []
      };
    } else {
      errorMessage.value = 'Профиль не найден';
    }
  } catch (error) {
    console.error('Ошибка загрузки профиля:', error);
    errorMessage.value = 'Ошибка при загрузке данных';
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
};

// Инициализация
onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUserId.value = user.uid;
    }
    loadProfileData();
  });
});
</script>

<template>
  <Header/>
  <main class="profile-page">
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
    </div>

    <div v-else-if="errorMessage" class="error-message">
      {{ errorMessage }}
      <router-link v-if="!userId" to="/auth" class="auth-link">Войти</router-link>
    </div>

    <div v-else class="profile-container">
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
                <i class="fas fa-graduation-cap"></i> Специальность: {{ profileData.specialty }}
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
                <button 
                  v-if="(!userId || userId === currentUserId) && currentUserId" 
                  @click="startEditing" 
                  class="edit-button"
                >
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
                <p v-if="!profileData.skills.length">Навыки не указаны</p>
              </div>
            </div>

            <div class="profile-section">
              <h3 class="section-title">Контакты</h3>
              <ul class="contact-list">
                <li v-if="profileData.email">
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
                <p v-if="!profileData.email && !profileData.socialLinks.behance && 
                         !profileData.socialLinks.dribbble && !profileData.socialLinks.vk">
                  Контакты не указаны
                </p>
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
                <div class="project-image-container">
                  <img :src="project.images?.[0] || 'https://via.placeholder.com/800x400?text=Project+Image'" 
                       :alt="project.title" 
                       class="project-image">
                  <div class="project-overlay">
                    <span class="project-rating" v-if="project.rating">
                      <i class="fas fa-star"></i> {{ project.rating }}
                    </span>
                    <span class="project-views" v-if="project.views">
                      <i class="fas fa-eye"></i> {{ project.views }}
                    </span>
                  </div>
                </div>
                <div class="project-info">
                  <h3 class="project-title">{{ project.title || 'Без названия' }}</h3>
                  <p class="project-type">{{ project.type || 'Тип не указан' }}</p>
                  <p class="project-date">{{ project.date || 'Дата не указана' }}</p>
                </div>
              </div>
              <div v-if="!profileData.projects.length" class="empty-state">
                <i class="fas fa-folder-open"></i>
                <p>Проекты не найдены</p>
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
    </div>
  </main>
  <Footer/>
</template>

<style scoped>
/* Все оригинальные стили сохранены без изменений */
.error-message {
  text-align: center;
  padding: 2rem;
  color: #ff4444;
  font-size: 1.2rem;
}

.auth-link {
  display: block;
  margin-top: 1rem;
  color: #4285f4;
  text-decoration: none;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #ccc;
}
</style>
<style scoped>
@import "./profile.scss";
</style>