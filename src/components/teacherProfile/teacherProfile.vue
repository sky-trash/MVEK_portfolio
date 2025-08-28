<script setup lang="ts">
import Header from '../layouts/header/header.vue'
import Footer from '../layouts/footer/footer.vue'
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ProjectCard from '@/components/projectCard/projectCard.vue'
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { db, auth } from '@/firebase'

interface Group {
  id: string
  name: string
  studentCount: number
  teacherId?: string
  teacherName?: string
}

interface Project {
  id: string
  title: string
  previewImage: string
  type: string
  rating: number
  teacherId?: string
}

interface Teacher {
  id: string;
  userId?: string;
  name: string;
  position: string;
  avatar?: string;
  isVerified?: boolean;
  rating?: number;
  bio?: string;
  experience?: number | string;
  specialization?: string;
  email?: string;
  groups?: Group[];
  projects?: Project[];
  socialLinks?: {
    behance?: string;
    dribbble?: string;
    vk?: string;
    telegram?: string;
  };
  department?: string;
  subjects?: string[];
}

const route = useRoute()
const router = useRouter()
const teacher = ref<Teacher | null>(null)
const loading = ref(true)
const isOwnProfile = ref(false)
const currentUserId = ref<string | null>(null)

const formattedRating = computed(() => {
  const rating = teacher.value?.rating || 0;
  return rating.toFixed(1);
});

const starRating = computed(() => {
  const rating = teacher.value?.rating || 0;
  return Math.round(rating);
});

// Получаем ID текущего пользователя
onMounted(() => {
  const user = auth.currentUser
  if (user) {
    currentUserId.value = user.uid
  }
})

// Функция для получения данных преподавателя из коллекции users
const fetchTeacherFromUsers = async (teacherId: string) => {
  try {
    // Упрощенный запрос - ищем только по userId
    const usersQuery = query(collection(db, 'users'), where('userId', '==', teacherId))
    const usersSnapshot = await getDocs(usersQuery)

    if (!usersSnapshot.empty) {
      const userDoc = usersSnapshot.docs[0]
      const userData = userDoc.data()

      // Получаем группы, которые курирует преподаватель (упрощенный запрос)
      const groupsQuery = query(collection(db, 'groups'))
      const groupsSnapshot = await getDocs(groupsQuery)
      const groups = groupsSnapshot.docs
        .filter(doc => doc.data().teacherId === teacherId)
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Group[]

      // Получаем все проекты и фильтруем на клиенте
      const projectsQuery = query(collection(db, 'projects'), orderBy('createdAt', 'desc'))
      const projectsSnapshot = await getDocs(projectsQuery)
      const projects = projectsSnapshot.docs
        .filter(doc => doc.data().teacherId === teacherId)
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Project[]

      return {
        id: userDoc.id,
        userId: userData.userId,
        name: `${userData.surname} ${userData.name} ${userData.lname || ''}`.trim(),
        position: userData.position || 'Преподаватель',
        avatar: userData.avatarUrl || '',
        isVerified: userData.isVerified || false,
        rating: userData.rating || 0,
        bio: userData.bio || '',
        experience: userData.experience || 0,
        specialization: userData.specialization || '',
        email: userData.email || '',
        groups: groups,
        projects: projects,
        socialLinks: userData.socialLinks || {}
      } as Teacher
    }

    return null
  } catch (error) {
    console.error('Ошибка поиска преподавателя в users:', error)
    return null
  }
}

const fetchTeacherData = async (id: string) => {
  try {
    // Сначала ищем в коллекции teachers
    const teacherDoc = await getDoc(doc(db, 'teachers', id));
    if (teacherDoc.exists()) {
      return { id: teacherDoc.id, ...teacherDoc.data() } as Teacher;
    }

    // Если не найден в teachers, ищем в users
    const userDoc = await getDoc(doc(db, 'users', id));
    if (userDoc.exists() && userDoc.data().role === 'teacher') {
      return { id: userDoc.id, ...userDoc.data() } as Teacher;
    }

    throw new Error('Преподаватель не найден');
  } catch (error) {
    console.error('Ошибка загрузки данных преподавателя:', error);
    throw error;
  }
};

onMounted(async () => {
  try {
    loading.value = true;

    // Получаем ID из параметров маршрута
    const teacherId = route.params.id as string;

    if (!teacherId) {
      throw new Error('ID преподавателя не указан');
    }

    teacher.value = await fetchTeacherData(teacherId);

    // Проверяем, является ли это профиль текущего пользователя
    if (currentUserId.value && teacher.value.userId === currentUserId.value) {
      isOwnProfile.value = true;
    }
  } catch (error) {
    console.error('Ошибка загрузки данных:', error);
  } finally {
    loading.value = false;
  }
});

const navigateToProject = (projectId: string) => {
  router.push(`/project/${projectId}`)
}

const editProfile = () => {
  router.push('/teacherProfile/edit')
}
</script>

<template>
  <Header />
  <div class="teacher-profile-container">
    <div v-if="loading" class="loading-spinner">
      <div class="spinner"></div>
    </div>

    <div v-else-if="teacher" class="teacher-profile">
      <!-- Шапка профиля -->
      <div class="profile-header">
        <div class="avatar-container">
          <img src="../../../public/logo.png" class="avatar">
          <div class="verified-badge" v-if="teacher.isVerified">✓</div>
        </div>

        <div class="profile-info">
          <div class="name-and-actions">
            <h1 class="teacher-name">{{ teacher.name }}</h1>
            <button v-if="isOwnProfile" @click="editProfile" class="edit-button">
              Редактировать профиль
            </button>
          </div>
          <p class="teacher-position">{{ teacher.position }}</p>

          <div class="rating-container">
            <div class="stars">
              <span v-for="n in 5" :key="n" :class="['star', { 'filled': n <= starRating }]">★</span>
            </div>
            <span class="rating-value">{{ formattedRating }}</span>
          </div>
        </div>
      </div>

      <!-- Основная информация -->
      <div class="profile-content">
        <section class="about-section">
          <h2>О преподавателе</h2>
          <p class="bio">{{ teacher.bio || 'Информация о преподавателе пока не добавлена.' }}</p>

          <div class="details-grid">
            <div class="detail-item">
              <span class="detail-label">Стаж:</span>
              <span class="detail-value">{{ teacher.experience }} лет</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Специализация:</span>
              <span class="detail-value">{{ teacher.specialization || 'Не указана' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Кафедра:</span>
              <span class="detail-value">{{ teacher.department || 'Не указана' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Email:</span>
              <a :href="`mailto:${teacher.email}`" class="detail-value link">{{ teacher.email }}</a>
            </div>
          </div>

          <!-- Социальные сети -->
          <div
            v-if="teacher.socialLinks && (teacher.socialLinks.behance || teacher.socialLinks.dribbble || teacher.socialLinks.vk)"
            class="social-links">
            <h3>Социальные сети</h3>
            <div class="social-icons">
              <a v-if="teacher.socialLinks.behance" :href="teacher.socialLinks.behance" target="_blank"
                class="social-link">
                <i class="fab fa-behance"></i>
              </a>
              <a v-if="teacher.socialLinks.dribbble" :href="teacher.socialLinks.dribbble" target="_blank"
                class="social-link">
                <i class="fab fa-dribbble"></i>
              </a>
              <a v-if="teacher.socialLinks.vk" :href="teacher.socialLinks.vk" target="_blank" class="social-link">
                <i class="fab fa-vk"></i>
              </a>
            </div>
          </div>
        </section>

        <!-- Курируемые группы -->
        <section class="groups-section" v-if="teacher.groups && teacher.groups.length > 0">
          <h2>Курируемые группы</h2>
          <div class="groups-grid">
            <router-link v-for="group in teacher.groups" :key="group.id" :to="`/students?group=${group.id}`"
              class="group-card">
              <span class="group-name">{{ group.name }}</span>
              <span class="student-count">{{ group.studentCount }} студентов</span>
            </router-link>
          </div>
        </section>

        <!-- Студенческие проекты -->
        <section class="projects-section" v-if="teacher.projects && teacher.projects.length > 0">
          <h2>Руководство проектами</h2>
          <div class="projects-grid">
            <project-card v-for="project in teacher.projects" :key="project.id" :project="project"
              @click="navigateToProject(project.id)" />
          </div>
        </section>

        <!-- Сообщение, если нет групп или проектов -->
        <div v-if="(!teacher.groups || teacher.groups.length === 0) &&
          (!teacher.projects || teacher.projects.length === 0)" class="empty-state">
          <h3>Пока нет информации</h3>
          <p>Группы и проекты появятся здесь после их добавления.</p>
        </div>
      </div>
    </div>

    <div v-else class="not-found-message">
      <h3>Преподаватель не найден</h3>
      <p>Запрошенный профиль преподавателя не существует или был удален.</p>
      <router-link to="/teachers" class="back-link">← К списку преподавателей</router-link>
    </div>
  </div>
  <Footer />
</template>
<style scoped>
@import "./teacherProfile.scss";

/* Стили для групп */
.groups-section {
  margin-bottom: 3rem;
}

.groups-section h2 {
  color: #2d3748;
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 3px solid #e2e8f0;
  position: relative;
}

.groups-section h2::after {
  content: '';
  position: absolute;
  bottom: -3px;
  left: 0;
  width: 60px;
  height: 3px;
  background: linear-gradient(135deg, #4a6cf7 0%, #667eea 100%);
  border-radius: 3px;
}

.groups-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.group-card {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.5rem;
  text-decoration: none;
  color: #2d3748;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.group-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(135deg, #4a6cf7 0%, #667eea 100%);
  border-radius: 4px 4px 0 0;
}

.group-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.group-card:hover .group-name {
  color: #4a6cf7;
}

.group-name {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  transition: color 0.3s ease;
  display: block;
}

.student-count {
  font-size: 0.9rem;
  color: #718096;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.student-count::before {
  content: '👥';
  font-size: 1rem;
}

/* Адаптивность для групп */
@media (max-width: 768px) {
  .groups-grid {
    grid-template-columns: 1fr;
  }

  .group-card {
    padding: 1.25rem;
  }

  .group-name {
    font-size: 1.1rem;
  }
}

@media (max-width: 480px) {
  .groups-section h2 {
    font-size: 1.5rem;
  }

  .group-card {
    padding: 1rem;
  }
}
</style>