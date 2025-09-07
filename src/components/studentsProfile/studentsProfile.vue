<script setup lang="ts">
import Header from '../layouts/header/header.vue';
import Footer from '../layouts/footer/footer.vue';
import { ref, onMounted, computed, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  doc, getDoc, collection, query, where, getDocs,
  updateDoc, arrayUnion, arrayRemove, addDoc,
  deleteDoc, orderBy, onSnapshot
} from 'firebase/firestore';
import { db, auth } from '@/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const route = useRoute();
const router = useRouter();
const userId = ref(route.params.id || '');

// Функция для получения URL аватарки
const getAvatarUrl = (avatar: string): string => {
  if (avatar && avatar !== '/placeholder-avatar.png' && avatar !== '@/public/logo.png') {
    return avatar;
  }
  return '/logo.png';
};

// Данные профиля
const profileData = ref({
  id: '',
  avatar: '/placeholder-avatar.png',
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
  skills: [] as string[],
  projectIds: [] as string[]
});

// Проекты пользователя
const userProjects = ref<any[]>([]);
const specialtiesList = ref<string[]>([]); // Список специальностей из Firestore

// Состояния
const isLoading = ref(true);
const activeTab = ref('projects');
const currentUserId = ref('');
const errorMessage = ref('');
const isBioExpanded = ref(false);
const maxBioLength = 100; // Максимальная длина текста в свернутом состоянии
const visibleProjectsCount = ref(4); // Показываем первые 4 проекта

const hasMoreProjects = computed(() => {
  return visibleProjectsCount.value < userProjects.value.length;
});

const showMoreProjects = () => {
  visibleProjectsCount.value += 4;
};

// Проекты для отображения
const visibleProjects = computed(() => {
  return userProjects.value.slice(0, visibleProjectsCount.value);
});

const truncatedBio = computed(() => {
  return profileData.value.bio.slice(0, maxBioLength) +
    (profileData.value.bio.length > maxBioLength ? '...' : '');
});

const shouldShowReadMore = computed(() => {
  return profileData.value.bio.length > maxBioLength;
});

// Проверка, является ли текущий пользователь владельцем профиля
const isOwnProfile = computed(() => {
  return !userId.value || userId.value === currentUserId.value;
});

// Загрузка специальностей из Firestore
const loadSpecialties = async () => {
  try {
    const specialtiesSnapshot = await getDocs(collection(db, 'specialties'));
    specialtiesList.value = specialtiesSnapshot.docs.map(doc => doc.data().name);
    console.log('Загружено специальностей:', specialtiesList.value);
  } catch (error) {
    console.error('Ошибка загрузки специальностей:', error);
  }
};

// Улучшенная функция поиска пользователя
const findUserDocument = async (identifier: string) => {
  try {
    if (!identifier.includes('/')) {
      const docRef = doc(db, 'users', identifier);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) return { doc: docSnap, id: docSnap.id };
    }

    const q1 = query(collection(db, 'users'), where('userId', '==', identifier));
    const querySnapshot1 = await getDocs(q1);
    if (!querySnapshot1.empty) return { doc: querySnapshot1.docs[0], id: querySnapshot1.docs[0].id };

    const q2 = query(collection(db, 'users'), where('email', '==', identifier));
    const querySnapshot2 = await getDocs(q2);
    if (!querySnapshot2.empty) return { doc: querySnapshot2.docs[0], id: querySnapshot2.docs[0].id };

    const q3 = query(collection(db, 'users'), where('login', '==', identifier));
    const querySnapshot3 = await getDocs(q3);
    if (!querySnapshot3.empty) return { doc: querySnapshot3.docs[0], id: querySnapshot3.docs[0].id };

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

    // Убеждаемся, что identifier - строка. Если это массив, берем первый элемент.
    const identifierValue = Array.isArray(identifier) ? identifier[0] : identifier;
    const userData = await findUserDocument(identifierValue);

    if (userData) {
      const data = userData.doc.data();

      profileData.value = {
        id: userData.id,
        avatar: data.avatarUrl || data.avatarBase64 || '/placeholder-avatar.png',
        nickname: data.login || '',
        fullName: [data.surname, data.name, data.lname].filter(Boolean).join(' ') || 'Не указано',
        group: data.group || 'Не указана',
        specialty: data.specialty || 'Не указана',
        bio: data.bio || 'Пользователь пока не добавил информацию о себе',
        email: data.email || '',
        socialLinks: {
          behance: data.socialLinks?.behance || '',
          dribbble: data.socialLinks?.dribbble || '',
          vk: data.socialLinks?.vk || ''
        },
        skills: data.skills || [],
        projectIds: data.projectIds || []
      };

      await loadUserProjects(profileData.value.projectIds);
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

// Загрузка проектов пользователя
const loadUserProjects = async (projectIds: string[]) => {
  try {
    if (projectIds.length === 0) {
      userProjects.value = [];
      return;
    }

    const projectsPromises = projectIds.map(async (projectId) => {
      const projectRef = doc(db, 'projects', projectId);
      const projectSnap = await getDoc(projectRef);
      if (projectSnap.exists()) {
        return { id: projectSnap.id, ...projectSnap.data() };
      }
      return null;
    });

    const projects = await Promise.all(projectsPromises);
    userProjects.value = projects.filter(project => project !== null) as any[];

  } catch (error) {
    console.error('Ошибка загрузки проектов:', error);
    userProjects.value = [];
  }
};

// Переход на детальную страницу проекта
const goToProjectDetail = (projectId: string) => {
  router.push(`/project/${projectId}`);
};

// Инициализация
onMounted(() => {
  loadSpecialties(); // Загружаем список специальностей
  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUserId.value = user.uid;
    }
    loadProfileData();
  });
});
</script>

<template>
  <Header />
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
            <img :src="getAvatarUrl(profileData.avatar)" :alt="profileData.fullName" class="avatar-image">
            <div class="avatar-badge">Студент</div>
          </div>

          <div class="profile-info">
            <div class="name-and-actions">
              <h1 class="profile-name">{{ profileData.fullName }}</h1>
            </div>
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
              <div class="profile-bio">
                <p>
                  {{ isBioExpanded ? profileData.bio : truncatedBio }}
                </p>
                <button v-if="shouldShowReadMore" @click="isBioExpanded = !isBioExpanded" class="read-more-button">
                  {{ isBioExpanded ? 'Свернуть' : 'Читать далее' }}
                </button>
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
                  <i class="fas fa-envelope">✉️</i>
                  <span>{{ profileData.email }}</span>
                </li>
                <li>
                  <i class="fab fa-behance">💿</i>
                  <a v-if="profileData.socialLinks.behance" :href="profileData.socialLinks.behance" target="_blank">
                    Behance
                  </a>
                  <span v-else>Не указано</span>
                </li>
                <li>
                  <i class="fab fa-dribbble">💿</i>
                  <a v-if="profileData.socialLinks.dribbble" :href="profileData.socialLinks.dribbble" target="_blank">
                    Dribbble
                  </a>
                  <span v-else>Не указано</span>
                </li>
                <li>
                  <i class="fab fa-vk">✌️</i>
                  <a v-if="profileData.socialLinks.vk" :href="profileData.socialLinks.vk" target="_blank">
                    ВКонтакте
                  </a>
                  <span v-else>Не указано</span>
                </li>
              </ul>
            </div>
          </div>

          <div class="profile-main">
            <div class="profile-tabs">
              <button @click="activeTab = 'projects'" :class="{ 'active': activeTab === 'projects' }"
                class="tab-button">
                Проекты ({{ userProjects.length }})
              </button>
              <button @click="activeTab = 'achievements'" :class="{ 'active': activeTab === 'achievements' }"
                class="tab-button">
                Достижения
              </button>
              <button @click="activeTab = 'activity'" :class="{ 'active': activeTab === 'activity' }"
                class="tab-button">
                Активность
              </button>
            </div>

            <div v-if="activeTab === 'projects'" class="projects-section">
              <div class="projects-grid">
                <div v-for="(project, index) in visibleProjects" :key="index" class="project-card"
                  @click="goToProjectDetail(project.id)">
                  <div class="project-image-container">
                    <img :src="project.images[0] || '/placeholder-project.png'" :alt="project.title"
                      class="project-image">
                    <div class="project-overlay">
                      <span class="project-rating">
                        <i class="fas fa-star"></i> {{ project.rating || 0 }}
                      </span>
                      <span class="project-views">
                        <i class="fas fa-eye"></i> {{ project.views || 0 }}
                      </span>
                    </div>
                  </div>
                  <div class="project-info">
                    <h3 class="project-title">{{ project.title || 'Без названия' }}</h3>
                    <p class="project-type">{{ project.type || 'Тип не указан' }}</p>
                    <p class="project-description" v-if="project.description">{{ project.description }}</p>
                    <p class="project-date">{{ new Date(project.date).toLocaleDateString() || 'Дата не указана' }}</p>
                  </div>
                </div>
              </div>

              <!-- Кнопка "Показать еще" -->
              <div v-if="hasMoreProjects" class="load-more-container">
                <button @click="showMoreProjects" class="load-more-button">
                  <i class="fas fa-chevron-down"></i>
                  Показать еще
                  <span class="projects-count">({{ userProjects.length - visibleProjectsCount }} из {{
                    userProjects.length }})</span>
                </button>
              </div>

              <div v-if="!userProjects.length" class="empty-state">
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
  <Footer />
</template>
<style scoped lang="scss">
@import "./studentsProfile.scss";

.load-more-container {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
  padding: 1rem 0;
}

.load-more-button {
  background: linear-gradient(135deg, #4a6cf7 0%, #667eea 100%);
  color: white;
  border: none;
  border-radius: 50px;
  padding: 1rem 2rem;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 4px 15px rgba(74, 108, 247, 0.3);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(74, 108, 247, 0.4);
  }

  &:active {
    transform: translateY(0);
  }

  .projects-count {
    font-size: 0.9rem;
    opacity: 0.9;
    background: rgba(255, 255, 255, 0.2);
    padding: 0.3rem 0.8rem;
    border-radius: 20px;
    margin-left: 0.5rem;
  }
}

/* Адаптивность */
@media (max-width: 768px) {
  .load-more-button {
    padding: 0.9rem 1.5rem;
    font-size: 0.9rem;

    .projects-count {
      font-size: 0.8rem;
      padding: 0.2rem 0.6rem;
    }
  }
}

@media (max-width: 480px) {
  .load-more-button {
    width: 100%;
    max-width: 280px;
    justify-content: center;
  }
}
</style>