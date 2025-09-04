<script setup lang="ts">
import Header from '../layouts/header/header.vue'
import Footer from '../layouts/footer/footer.vue'
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ProjectCard from '@/components/projectCard/projectCard.vue'
import {
  doc, getDoc, collection, getDocs, orderBy, where, query,
  updateDoc, arrayUnion, arrayRemove
} from 'firebase/firestore'
import { db, auth } from '@/firebase'
import { onAuthStateChanged } from 'firebase/auth'

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
  createdAt?: any
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
const isBaseProfile = ref(false)
const isEditing = ref(false)
const editedBio = ref('')
const isBioExpanded = ref(false)
const isUploadingAvatar = ref(false)
const errorMessage = ref('')

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

// Функция для получения всех проектов и фильтрации на клиенте
const fetchProjectsForTeacher = async (teacherId: string) => {
  try {
    const projectsSnapshot = await getDocs(collection(db, 'projects'));
    const allProjects = projectsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Project[];

    // Фильтруем проекты по teacherId на клиенте
    return allProjects.filter(project => project.teacherId === teacherId)
      .sort((a, b) => {
        // Сортируем по дате создания (новые сначала)
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
  } catch (error) {
    console.error('Ошибка загрузки проектов:', error);
    return [];
  }
}

// Функция для получения всех групп и фильтрации на клиенте
const fetchGroupsForTeacher = async (teacherId: string) => {
  try {
    const groupsSnapshot = await getDocs(collection(db, 'groups'));
    const allGroups = groupsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Group[];

    // Фильтруем группы по teacherId на клиенте
    return allGroups.filter(group => group.teacherId === teacherId);
  } catch (error) {
    console.error('Ошибка загрузки групп:', error);
    return [];
  }
}

// Функция для получения данных преподавателя по ID пользователя
const fetchTeacherByUserId = async (userId: string) => {
  try {
    const usersQuery = query(collection(db, 'users'), where('userId', '==', userId));
    const querySnapshot = await getDocs(usersQuery);

    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();

      if (userData.role !== 'teacher') {
        throw new Error('Пользователь не является преподавателем');
      }

      const [groups, projects] = await Promise.all([
        fetchGroupsForTeacher(userId),
        fetchProjectsForTeacher(userId)
      ]);

      return {
        id: userDoc.id,
        userId: userData.userId,
        name: `${userData.surname} ${userData.name} ${userData.lname || ''}`.trim(),
        position: userData.position || 'Преподаватель',
        avatar: userData.avatarUrl || userData.avatarBase64 || '@/public/logo.png',
        isVerified: userData.isVerified || false,
        rating: userData.rating || 0,
        bio: userData.bio || '',
        experience: userData.experience || 0,
        specialization: userData.specialization || '',
        email: userData.email || '',
        groups: groups,
        projects: projects,
        socialLinks: userData.socialLinks || {},
        department: userData.department || '',
        subjects: userData.subjects || []
      } as Teacher;
    }

    throw new Error('Преподаватель не найден');
  } catch (error) {
    console.error('Ошибка загрузки данных преподавателя:', error);
    throw error;
  }
};

// Функция для получения данных преподавателя
const fetchTeacherData = async (teacherId: string) => {
  try {
    // Сначала ищем в коллекции users
    const userDoc = await getDoc(doc(db, 'users', teacherId));
    if (userDoc.exists()) {
      const userData = userDoc.data();

      // Проверяем, является ли пользователь преподавателем
      if (userData.role !== 'teacher') {
        throw new Error('Пользователь не является преподавателем');
      }

      // Параллельно загружаем группы и проекты
      const [groups, projects] = await Promise.all([
        fetchGroupsForTeacher(teacherId),
        fetchProjectsForTeacher(teacherId)
      ]);

      return {
        id: userDoc.id,
        userId: userData.userId,
        name: `${userData.surname} ${userData.name} ${userData.lname || ''}`.trim(),
        position: userData.position || 'Преподаватель',
        avatar: userData.avatarUrl || userData.avatarBase64 || '@/public/logo.png',
        isVerified: userData.isVerified || false,
        rating: userData.rating || 0,
        bio: userData.bio || '',
        experience: userData.experience || 0,
        specialization: userData.specialization || '',
        email: userData.email || '',
        groups: groups,
        projects: projects,
        socialLinks: userData.socialLinks || {},
        department: userData.department || '',
        subjects: userData.subjects || []
      } as Teacher;
    }

    // Если не найден в users, ищем в коллекции teachers (для обратной совместимости)
    const teacherDoc = await getDoc(doc(db, 'teachers', teacherId));
    if (teacherDoc.exists()) {
      const teacherData = teacherDoc.data();

      // Для старой структуры также загружаем группы и проекты
      const [groups, projects] = await Promise.all([
        fetchGroupsForTeacher(teacherId),
        fetchProjectsForTeacher(teacherId)
      ]);

      return {
        id: teacherDoc.id,
        ...teacherData,
        groups: groups,
        projects: projects
      } as Teacher;
    }

    throw new Error('Преподаватель не найден');
  } catch (error) {
    console.error('Ошибка загрузки данных преподавателя:', error);
    throw error;
  }
};

// ЗАГРУЗКА АВАТАРА
const handleAvatarUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (!target.files || !target.files[0]) return;

  const file = target.files[0];

  // Валидация файла
  if (!file.type.match('image.*')) {
    errorMessage.value = 'Пожалуйста, выберите изображение (JPEG, PNG, GIF, JPG)';
    return;
  }

  if (file.size > 2 * 1024 * 1024) {
    errorMessage.value = 'Размер файла не должен превышать 2MB';
    return;
  }

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      isUploadingAvatar.value = true;
      errorMessage.value = '';

      // Сохраняем изображение как base64
      const imageData = e.target?.result as string;

      // Обновляем данные пользователя в Firestore
      const userRef = doc(db, 'users', teacher.value!.id);
      await updateDoc(userRef, {
        avatarBase64: imageData,
        updatedAt: new Date().toISOString()
      });

      // Просто перезагружаем страницу
      window.location.reload();

    } catch (error) {
      console.error('Ошибка загрузки аватара:', error);
      errorMessage.value = 'Ошибка при загрузке аватара';
    } finally {
      isUploadingAvatar.value = false;
    }
  };
  reader.readAsDataURL(file);
};

// УДАЛЕНИЕ АВАТАРА
const removeAvatar = async () => {
  if (!confirm('Удалить аватар?')) return;

  try {
    // Обновляем данные пользователя
    const userRef = doc(db, 'users', teacher.value!.id);
    await updateDoc(userRef, {
      avatarBase64: null,
      updatedAt: new Date().toISOString()
    });

    // Просто перезагружаем страницу
    window.location.reload();

  } catch (error) {
    console.error('Ошибка удаления аватара:', error);
    errorMessage.value = 'Ошибка при удалении аватара';
  }
};

// Редактирование профиля
const startEditing = () => {
  editedBio.value = teacher.value?.bio || '';
  isEditing.value = true;
  isBioExpanded.value = true;
};

const saveProfile = async () => {
  try {
    const userRef = doc(db, 'users', teacher.value!.id);
    await updateDoc(userRef, {
      bio: editedBio.value,
      updatedAt: new Date().toISOString()
    });

    // Просто перезагружаем страницу
    window.location.reload();

  } catch (error) {
    console.error('Ошибка сохранения профиля:', error);
    errorMessage.value = 'Ошибка при сохранении данных';
  }
};

onMounted(async () => {
  try {
    loading.value = true;

    // Получаем ID из параметров маршрута
    const teacherId = route.params.id as string;

    if (!teacherId) {
      // Если ID не передан, загружаем собственный профиль
      isBaseProfile.value = true;
      const user = auth.currentUser;

      if (!user) {
        throw new Error('Пользователь не авторизован');
      }

      teacher.value = await fetchTeacherByUserId(user.uid);

      // Проверяем, является ли это профиль текущего пользователя
      if (currentUserId.value && teacher.value.userId === currentUserId.value) {
        isOwnProfile.value = true;
      }
    } else {
      // Загружаем профиль по ID
      isBaseProfile.value = false;
      teacher.value = await fetchTeacherData(teacherId);

      // Проверяем, является ли это профиль текущего пользователя
      if (currentUserId.value && teacher.value.userId === currentUserId.value) {
        isOwnProfile.value = true;
      }
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
          <img :src="teacher.avatar || '@/public/logo.png'" class="avatar">
          <div class="verified-badge" v-if="teacher.isVerified">✓</div>
          <div v-if="isOwnProfile" class="avatar-upload">
            <label for="avatar-upload" class="avatar-upload-label">
              <i class="fas fa-camera">+</i>
              <input id="avatar-upload" type="file" accept="image/jpeg,image/png,image/gif" @change="handleAvatarUpload"
                :disabled="isUploadingAvatar" class="avatar-upload-input">
            </label>
            <div v-if="isUploadingAvatar" class="avatar-upload-loading">
              <i class="fas fa-spinner fa-spin"></i>
            </div>
            <button v-if="teacher.avatar !== '@/public/logo.png' && isOwnProfile" @click="removeAvatar"
              class="avatar-upload-label" title="Удалить аватар">
              <i class="fas fa-camera">-</i>
            </button>
          </div>
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

          <div v-if="!isEditing" class="profile-bio">
            <p :class="{ 'bio-collapsed': !isBioExpanded && teacher.bio && teacher.bio.length > 150 }">
              {{ isBioExpanded ? teacher.bio : (teacher.bio ? teacher.bio.slice(0, 150) + (teacher.bio.length > 150 ?
                '...' : '') : 'Информация о преподавателе пока не добавлена.') }}
            </p>
            <div v-if="teacher.bio && teacher.bio.length > 150" class="bio-toggle">
              <button @click="isBioExpanded = !isBioExpanded" class="read-more-button">
                {{ isBioExpanded ? 'Свернуть' : 'Читать далее' }}
              </button>
            </div>
            <button v-if="isOwnProfile" @click="startEditing" class="edit-button">
              <i class="fas fa-edit"></i> Редактировать
            </button>
          </div>

          <div v-else class="profile-bio-edit">
            <textarea v-model="editedBio" class="bio-textarea" placeholder="Расскажите о себе..."></textarea>
            <div class="edit-actions">
              <button @click="saveProfile" class="save-button">Сохранить</button>
              <button @click="isEditing = false" class="cancel-button">Отмена</button>
            </div>
          </div>

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
            v-if="teacher.socialLinks && (teacher.socialLinks.behance || teacher.socialLinks.dribbble || teacher.socialLinks.vk || teacher.socialLinks.telegram)"
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
              <a v-if="teacher.socialLinks.telegram" :href="teacher.socialLinks.telegram" target="_blank"
                class="social-link">
                <i class="fab fa-telegram"></i>
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
</style>