<script setup lang="ts">
import Header from '../layouts/header/header.vue';
import Footer from '../layouts/footer/footer.vue';
import { ref, onMounted, computed } from 'vue';
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
const isEditing = ref(false);
const editedBio = ref('');
const newSkill = ref('');
const currentUserId = ref('');
const errorMessage = ref('');
const isAddingProject = ref(false);
const isSavingProject = ref(false);

// Данные для нового проекта
const newProject = ref({
  title: '',
  type: '',
  description: '',
  date: new Date().toISOString().split('T')[0],
  images: [] as string[]
});

// Проверка, является ли текущий пользователь владельцем профиля
const isOwnProfile = computed(() => {
  return !userId.value || userId.value === currentUserId.value;
});

// Проверка валидности формы
const isFormValid = computed(() => {
  return newProject.value.title.trim() !== '' &&
    newProject.value.type.trim() !== '' &&
    newProject.value.description.trim() !== '';
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

    const userData = await findUserDocument(identifier);

    if (userData) {
      const data = userData.doc.data();

      profileData.value = {
        id: userData.id,
        avatar: data.avatarUrl || '/placeholder-avatar.png',
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

// Редактирование профиля
const startEditing = () => {
  editedBio.value = profileData.value.bio;
  isEditing.value = true;
};

const saveProfile = async () => {
  try {
    const userRef = doc(db, 'users', profileData.value.id);
    await updateDoc(userRef, {
      bio: editedBio.value
    });

    profileData.value.bio = editedBio.value;
    isEditing.value = false;
  } catch (error) {
    console.error('Ошибка сохранения профиля:', error);
    errorMessage.value = 'Ошибка при сохранении данных';
  }
};

// Управление навыками
const addSkill = async () => {
  if (!newSkill.value.trim()) return;

  try {
    const userRef = doc(db, 'users', profileData.value.id);
    await updateDoc(userRef, {
      skills: arrayUnion(newSkill.value.trim())
    });

    profileData.value.skills.push(newSkill.value.trim());
    newSkill.value = '';
  } catch (error) {
    console.error('Ошибка добавления навыка:', error);
    errorMessage.value = 'Ошибка при добавлении навыка';
  }
};

const removeSkill = async (skill: string) => {
  try {
    const userRef = doc(db, 'users', profileData.value.id);
    await updateDoc(userRef, {
      skills: arrayRemove(skill)
    });

    profileData.value.skills = profileData.value.skills.filter(s => s !== skill);
  } catch (error) {
    console.error('Ошибка удаления навыка:', error);
    errorMessage.value = 'Ошибка при удалении навыка';
  }
};

// Обновление контактов
const updateContacts = async () => {
  try {
    const userRef = doc(db, 'users', profileData.value.id);
    await updateDoc(userRef, {
      socialLinks: profileData.value.socialLinks
    });
  } catch (error) {
    console.error('Ошибка обновления контактов:', error);
    errorMessage.value = 'Ошибка при обновлении контактов';
  }
};

// Добавление проекта в коллекцию projects
const handleProjectFiles = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    const files = Array.from(target.files);
    const maxFiles = 10;
    const filesToProcess = files.slice(0, maxFiles);

    filesToProcess.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        newProject.value.images.push(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    });
  }
};

const addProject = async () => {
  if (!isFormValid.value) return;

  try {
    isSavingProject.value = true;
    errorMessage.value = '';

    const projectData = {
      title: newProject.value.title.trim(),
      type: newProject.value.type.trim(),
      description: newProject.value.description.trim(),
      date: newProject.value.date,
      images: newProject.value.images.length > 0 ? newProject.value.images : ['/placeholder-project.png'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      authorId: profileData.value.id,
      authorName: profileData.value.fullName,
      rating: 0,
      views: 0,
      likes: 0,
      comments: []
    };

    const projectRef = await addDoc(collection(db, 'projects'), projectData);

    const userRef = doc(db, 'users', profileData.value.id);
    await updateDoc(userRef, {
      projectIds: arrayUnion(projectRef.id)
    });

    profileData.value.projectIds.push(projectRef.id);
    userProjects.value.unshift({
      id: projectRef.id,
      ...projectData
    });

    newProject.value = {
      title: '',
      type: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      images: []
    };

    isAddingProject.value = false;

  } catch (error) {
    console.error('Ошибка добавления проекта:', error);
    errorMessage.value = 'Ошибка при добавлении проекта';
  } finally {
    isSavingProject.value = false;
  }
};

// Функция для отмены добавления проекта
const cancelAddProject = () => {
  isAddingProject.value = false;
  newProject.value = {
    title: '',
    type: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    images: []
  };
  errorMessage.value = '';
};

// Удаление проекта
const removeProject = async (projectId: string) => {
  if (!confirm('Вы уверены, что хотите удалить этот проект?')) {
    return;
  }

  try {
    await deleteDoc(doc(db, 'projects', projectId));

    const userRef = doc(db, 'users', profileData.value.id);
    await updateDoc(userRef, {
      projectIds: arrayRemove(projectId)
    });

    profileData.value.projectIds = profileData.value.projectIds.filter(id => id !== projectId);
    userProjects.value = userProjects.value.filter(project => project.id !== projectId);

  } catch (error) {
    console.error('Ошибка удаления проекта:', error);
    errorMessage.value = 'Ошибка при удалении проекта';
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
const editProfile = () => {
  router.push('/profile/edit');
};
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
            <img src="../../../public/logo.png" class="avatar-image">
            <div class="avatar-badge">Студент</div>
          </div>

          <div class="profile-info">
            <div class="name-and-actions">
              <h1 class="profile-name">{{ profileData.fullName }}</h1>
              <button v-if="isOwnProfile" @click="editProfile" class="edit-profile-button">
                <i class="fas fa-edit"></i> Редактировать профиль
              </button>
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
              <div v-if="!isEditing" class="profile-bio">
                <p>{{ profileData.bio }}</p>
                <button v-if="isOwnProfile" @click="startEditing" class="edit-button">
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
                  <button v-if="isOwnProfile" @click="removeSkill(skill)" class="skill-remove">
                    <i class="fas fa-times">X</i>
                  </button>
                </span>
                <div v-if="isOwnProfile" class="add-skill-form">
                  <input v-model="newSkill" type="text" placeholder="Новый навык" class="skill-input">
                  <button @click="addSkill" class="add-skill-button">
                    <i class="fas fa-plus"></i> Добавить
                  </button>
                </div>
                <p v-if="!profileData.skills.length">Навыки не указаны</p>
              </div>
            </div>

            <div class="profile-section">
              <h3 class="section-title">Контакты</h3>
              <ul class="contact-list">
                <li v-if="profileData.email">
                  <i class="fas fa-envelope"></i>
                  <span>{{ profileData.email }}</span>
                </li>
                <li>
                  <i class="fab fa-behance"></i>
                  <input v-if="isOwnProfile" v-model="profileData.socialLinks.behance" placeholder="Ссылка на Behance"
                    class="contact-input" @blur="updateContacts">
                  <a v-else :href="profileData.socialLinks.behance" target="_blank"
                    v-show="profileData.socialLinks.behance">
                    Behance
                  </a>
                  <span v-if="!isOwnProfile && !profileData.socialLinks.behance">Не указано</span>
                </li>
                <li>
                  <i class="fab fa-dribbble"></i>
                  <input v-if="isOwnProfile" v-model="profileData.socialLinks.dribbble" placeholder="Ссылка на Dribbble"
                    class="contact-input" @blur="updateContacts">
                  <a v-else :href="profileData.socialLinks.dribbble" target="_blank"
                    v-show="profileData.socialLinks.dribbble">
                    Dribbble
                  </a>
                  <span v-if="!isOwnProfile && !profileData.socialLinks.dribbble">Не указано</span>
                </li>
                <li>
                  <i class="fab fa-vk"></i>
                  <input v-if="isOwnProfile" v-model="profileData.socialLinks.vk" placeholder="Ссылка на VK"
                    class="contact-input" @blur="updateContacts">
                  <a v-else :href="profileData.socialLinks.vk" target="_blank" v-show="profileData.socialLinks.vk">
                    ВКонтакте
                  </a>
                  <span v-if="!isOwnProfile && !profileData.socialLinks.vk">Не указано</span>
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
              <button v-if="isOwnProfile" @click="isAddingProject = !isAddingProject" class="add-project-button"
                :style="{ backgroundColor: isAddingProject ? '#2c5282' : '#3182ce' }">
                <i class="fas fa-plus"></i>
                {{ isAddingProject ? 'Отменить' : 'Добавить проект' }}
              </button>
            </div>

            <!-- Форма добавления проекта -->
            <div v-if="isAddingProject" class="add-project-form">
              <h3>Добавить новый проект</h3>
              <div class="form-group">
                <label>Название проекта <span class="required">*</span></label>
                <input v-model="newProject.title" type="text" class="form-input" placeholder="Введите название проекта">
                <small v-if="!newProject.title.trim()" class="error-text">Это поле обязательно</small>
              </div>

              <div class="form-group">
                <label>Тип проекта (специальность) <span class="required">*</span></label>
                <select v-model="newProject.type" class="form-select">
                  <option value="">Выберите из списка</option>
                  <option v-for="specialty in specialtiesList" :key="specialty" :value="specialty">
                    {{ specialty }}
                  </option>
                </select>
                <small v-if="!newProject.type.trim()" class="error-text">Это поле обязательно</small>
              </div>

              <div class="form-group">
                <label>Описание <span class="required">*</span></label>
                <textarea v-model="newProject.description" class="form-textarea" rows="3"
                  placeholder="Опишите ваш проект"></textarea>
                <small v-if="!newProject.description.trim()" class="error-text">Это поле обязательно</small>
              </div>

              <div class="form-group">
                <label>Дата</label>
                <input v-model="newProject.date" type="date" class="form-input">
              </div>

              <div class="form-group">
                <label>Изображения проекта (можно выбрать несколько)</label>
                <input type="file" accept="image/*" multiple @change="handleProjectFiles" class="form-input">
                <small>Максимум 10 изображений. Изображения будут храниться локально</small>
              </div>

              <div v-if="newProject.images.length" class="image-previews">
                <div v-for="(image, index) in newProject.images" :key="index" class="image-preview-item">
                  <img :src="image" alt="Превью" class="preview-image">
                  <button @click="newProject.images.splice(index, 1)" class="remove-image-button">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
              </div>

              <div class="form-actions">
                <button @click="addProject" class="save-button" :disabled="!isFormValid || isSavingProject" :style="{
                  backgroundColor: isFormValid ? '#3182ce' : '#a0aec0',
                  cursor: isFormValid && !isSavingProject ? 'pointer' : 'not-allowed'
                }">
                  <i class="fas fa-plus"></i>
                  {{ isSavingProject ? 'Добавление...' : 'Добавить проект' }}
                </button>
                <button @click="cancelAddProject" class="cancel-button">
                  <i class="fas fa-times"></i> Отмена
                </button>
              </div>
            </div>

            <div v-if="activeTab === 'projects'" class="projects-grid">
              <div v-for="(project, index) in userProjects" :key="index" class="project-card"
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
                  <button v-if="isOwnProfile" @click.stop="removeProject(project.id)" class="project-delete-button">
                    <i class="fas fa-trash">X</i>
                  </button>
                </div>
                <div class="project-info">
                  <h3 class="project-title">{{ project.title || 'Без названия' }}</h3>
                  <p class="project-type">{{ project.type || 'Тип не указан' }}</p>
                  <p class="project-description" v-if="project.description">{{ project.description }}</p>
                  <p class="project-date">{{ new Date(project.date).toLocaleDateString() || 'Дата не указана' }}</p>
                </div>
              </div>
              <div v-if="!userProjects.length && !isAddingProject" class="empty-state">
                <i class="fas fa-folder-open"></i>
                <p>Проекты не найдены</p>
                <button v-if="isOwnProfile" @click="isAddingProject = true" class="add-button">
                  <i class="fas fa-plus"></i> Добавить первый проект
                </button>
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
@import "./profile.scss";

.name-and-actions {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
}

.edit-profile-button {
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 25px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
  
  i {
    font-size: 0.9rem;
  }
}

@media (max-width: 768px) {
  .name-and-actions {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .edit-profile-button {
    order: 2;
  }
}

@media (max-width: 480px) {
  .edit-profile-button {
    width: 100%;
    justify-content: center;
  }
}
</style>