<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  doc, getDoc, collection, query, where, getDocs,
  updateDoc, arrayUnion, arrayRemove, addDoc,
  deleteDoc, orderBy, onSnapshot
} from 'firebase/firestore';
import { db, auth } from '@/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Header from '../layouts/header/header.vue';
import Footer from '../layouts/footer/footer.vue';

const route = useRoute();
const router = useRouter();
const userId = ref(route.params.id || '');

const profileData = ref({
  id: '',
  avatar: '@/public/logo.png',
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

const userProjects = ref<any[]>([]);
const specialtiesList = ref<string[]>([]);

const isLoading = ref(true);
const activeTab = ref('projects');
const isEditing = ref(false);
const editedBio = ref('');
const newSkill = ref('');
const currentUserId = ref('');
const errorMessage = ref('');
const isAddingProject = ref(false);
const isSavingProject = ref(false);
const isUploadingAvatar = ref(false);
const isBioExpanded = ref(false);
const expandedProjects = ref<Set<string>>(new Set());
const visibleProjectsCount = ref(4); // Показываем первые 4 проекта

const hasMoreProjects = computed(() => {
  return visibleProjectsCount.value < userProjects.value.length;
});

const showMoreProjects = () => {
  visibleProjectsCount.value += 4;
};

const visibleProjects = computed(() => {
  return userProjects.value.slice(0, visibleProjectsCount.value);
});

const newProject = ref({
  title: '',
  type: '',
  description: '',
  date: new Date().toISOString().split('T')[0],
  images: [] as string[]
});

const isOwnProfile = computed(() => {
  return !userId.value || userId.value === currentUserId.value;
});

const isFormValid = computed(() => {
  return newProject.value.title.trim() !== '' &&
    newProject.value.type.trim() !== '' &&
    newProject.value.description.trim() !== '' &&
    newProject.value.images.length > 0;
});

const loadSpecialties = async () => {
  try {
    if (!auth.currentUser) {
      console.error('Пользователь не аутентифицирован');
      return;
    }

    const specialtiesSnapshot = await getDocs(collection(db, 'specialties'));
    specialtiesList.value = specialtiesSnapshot.docs.map(doc => doc.data().name);
  } catch (error) {
    console.error('Ошибка загрузки специальностей:', error);
  }
};

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

const loadProfileData = async () => {
  try {
    isLoading.value = true;
    errorMessage.value = '';

    const identifier = userId.value || currentUserId.value;
    if (!identifier) {
      errorMessage.value = 'Не указан идентификатор пользователя';
      return;
    }

    const identifierValue = Array.isArray(identifier) ? identifier[0] : identifier;
    const userData = await findUserDocument(identifierValue);

    if (userData) {
      const data = userData.doc.data();

      profileData.value = {
        id: userData.id,
        avatar: data.avatarUrl || data.avatarBase64 || '../../../public/logo.png',
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

const handleAvatarUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (!target.files || !target.files[0]) return;

  const file = target.files[0];

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

      const imageData = e.target?.result as string;

      const userRef = doc(db, 'users', profileData.value.id);
      await updateDoc(userRef, {
        avatarBase64: imageData,
        updatedAt: new Date().toISOString()
      });

      // Обновляем локально
      profileData.value.avatar = imageData;

    } catch (error) {
      console.error('Ошибка загрузки аватара:', error);
      errorMessage.value = 'Ошибка при загрузке аватара';
    } finally {
      isUploadingAvatar.value = false;
    }
  };
  reader.readAsDataURL(file);
};

const removeAvatar = async () => {
  if (!confirm('Удалить аватар?')) return;

  try {
    const userRef = doc(db, 'users', profileData.value.id);
    await updateDoc(userRef, {
      avatarBase64: null,
      updatedAt: new Date().toISOString()
    });

    // Обновляем локально
    profileData.value.avatar = '../../../public/logo.png';

  } catch (error) {
    console.error('Ошибка удаления аватара:', error);
    errorMessage.value = 'Ошибка при удалении аватара';
  }
};

const startEditing = () => {
  editedBio.value = profileData.value.bio;
  isEditing.value = true;
  isBioExpanded.value = true;
};

const saveProfile = async () => {
  try {
    if (!auth.currentUser) {
      errorMessage.value = 'Необходимо авторизоваться';
      return;
    }

    const userRef = doc(db, 'users', profileData.value.id);
    await updateDoc(userRef, {
      bio: editedBio.value,
      updatedAt: new Date().toISOString()
    });

    profileData.value.bio = editedBio.value;
    isEditing.value = false;
    isBioExpanded.value = false;

  } catch (error) {
    console.error('Ошибка сохранения профиля:', error);
    errorMessage.value = 'Ошибка при сохранении данных';
  }
};

const addSkill = async () => {
  if (!newSkill.value.trim()) return;

  try {
    if (!auth.currentUser) {
      errorMessage.value = 'Необходимо авторизоваться';
      return;
    }

    const userRef = doc(db, 'users', profileData.value.id);
    await updateDoc(userRef, {
      skills: arrayUnion(newSkill.value.trim()),
      updatedAt: new Date().toISOString()
    });

    // Обновляем локально
    profileData.value.skills.push(newSkill.value.trim());
    newSkill.value = '';

  } catch (error) {
    console.error('Ошибка добавления навыка:', error);
    errorMessage.value = 'Ошибка при добавлении навыка';
  }
};

const removeSkill = async (skill: string) => {
  try {
    if (!auth.currentUser) {
      errorMessage.value = 'Необходимо авторизоваться';
      return;
    }

    const userRef = doc(db, 'users', profileData.value.id);
    await updateDoc(userRef, {
      skills: arrayRemove(skill),
      updatedAt: new Date().toISOString()
    });

    // Обновляем локально
    profileData.value.skills = profileData.value.skills.filter(s => s !== skill);

  } catch (error) {
    console.error('Ошибка удаления навыка:', error);
    errorMessage.value = 'Ошибка при удаления навыка';
  }
};

const updateContacts = async () => {
  try {
    if (!auth.currentUser) {
      errorMessage.value = 'Необходимо авторизоваться';
      return;
    }

    const userRef = doc(db, 'users', profileData.value.id);
    await updateDoc(userRef, {
      socialLinks: profileData.value.socialLinks,
      updatedAt: new Date().toISOString()
    });

    alert('Контакты успешно обновлены!');

  } catch (error) {
    console.error('Ошибка обновления контактов:', error);
    errorMessage.value = 'Ошибка при обновлении контактов';
  }
};

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
      projectIds: arrayUnion(projectRef.id),
      updatedAt: new Date().toISOString()
    });

    // Обновляем локально
    userProjects.value.push({ id: projectRef.id, ...projectData });
    isAddingProject.value = false;
    newProject.value = {
      title: '',
      type: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      images: []
    };

  } catch (error) {
    console.error('Ошибка добавления проекта:', error);
    errorMessage.value = 'Ошибка при добавлении проекта';
  } finally {
    isSavingProject.value = false;
  }
};

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

const removeProject = async (projectId: string) => {
  if (!confirm('Вы уверены, что хотите удалить этот проект?')) {
    return;
  }

  try {
    await deleteDoc(doc(db, 'projects', projectId));

    const userRef = doc(db, 'users', profileData.value.id);
    await updateDoc(userRef, {
      projectIds: arrayRemove(projectId),
      updatedAt: new Date().toISOString()
    });

    // Обновляем локально
    userProjects.value = userProjects.value.filter(project => project.id !== projectId);

  } catch (error) {
    console.error('Ошибка удаления проекта:', error);
    errorMessage.value = 'Ошибка при удалении проекта';
  }
};

const toggleProjectDescription = (projectId: string) => {
  if (expandedProjects.value.has(projectId)) {
    expandedProjects.value.delete(projectId);
  } else {
    expandedProjects.value.add(projectId);
  }
};

const isProjectExpanded = (projectId: string) => {
  return expandedProjects.value.has(projectId);
};

const goToProjectDetail = (projectId: string) => {
  router.push(`/project/${projectId}`);
};

const editProfile = () => {
  router.push('/profile/edit');
};

onMounted(() => {
  loadSpecialties();
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
  <div class="profile-page">
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
            <div v-if="isOwnProfile" class="avatar-upload">
              <label for="avatar-upload" class="avatar-upload-label">
                <i class="fas fa-camera">+</i>
                <input id="avatar-upload" type="file" accept="image/jpeg,image/png,image/gif"
                  @change="handleAvatarUpload" :disabled="isUploadingAvatar" class="avatar-upload-input">
              </label>
              <div v-if="isUploadingAvatar" class="avatar-upload-loading">
                <i class="fas fa-spinner fa-spin"></i>
              </div>
              <button v-if="profileData.avatar !== '@/public/logo.png' && isOwnProfile" @click="removeAvatar"
                class="avatar-upload-label" title="Удалить аватар">
                <i class="fas fa-camera">-</i>
              </button>
            </div>
            <div class="avatar-badge">Студент</div>
          </div>

          <div class="profile-info">
            <div class="name-and-actions">
              <h1 class="profile-name">{{ profileData.fullName }}</h1>
              <button v-if="isOwnProfile" @click="editProfile" class="edit-profile-button">
                Редактировать профиль
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
                <p :class="{ 'bio-collapsed': !isBioExpanded && profileData.bio.length > 150 }">
                  {{ isBioExpanded ? profileData.bio : profileData.bio.slice(0, 150) + (profileData.bio.length > 150 ?
                    '...' : '') }}
                </p>
                <div v-if="profileData.bio.length > 150" class="bio-toggle">
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
                    Добавить
                  </button>
                </div>
                <p v-if="!profileData.skills.length && !isOwnProfile">Навыки не указаны</p>
              </div>
            </div>

            <div class="profile-section">
              <h3 class="section-title">Контакты</h3>
              <ul class="contact-list">
                <li v-if="profileData.email">
                  <i class="fas fa-envelope">📩</i>
                  <span>{{ profileData.email }}</span>
                </li>
                <li>
                  <i class="fab fa-behance">💿</i>
                  <input v-if="isOwnProfile" v-model="profileData.socialLinks.behance" placeholder="Ссылка на Behance"
                    class="contact-input">
                  <a v-else :href="profileData.socialLinks.behance" target="_blank"
                    v-show="profileData.socialLinks.behance">
                    Behance
                  </a>
                  <span v-if="!isOwnProfile && !profileData.socialLinks.behance">Не указано</span>
                </li>
                <li>
                  <i class="fab fa-dribbble">💿</i>
                  <input v-if="isOwnProfile" v-model="profileData.socialLinks.dribbble" placeholder="Ссылка на Dribbble"
                    class="contact-input">
                  <a v-else :href="profileData.socialLinks.dribbble" target="_blank"
                    v-show="profileData.socialLinks.dribbble">
                    Dribbble
                  </a>
                  <span v-if="!isOwnProfile && !profileData.socialLinks.dribbble">Не указано</span>
                </li>
                <li>
                  <i class="fab fa-vk">✌️</i>
                  <input v-if="isOwnProfile" v-model="profileData.socialLinks.vk" placeholder="Ссылка на VK"
                    class="contact-input">
                  <a v-else :href="profileData.socialLinks.vk" target="_blank" v-show="profileData.socialLinks.vk">
                    ВКонтакте
                  </a>
                  <span v-if="!isOwnProfile && !profileData.socialLinks.vk">Не указано</span>
                </li>
              </ul>
              <button v-if="isOwnProfile" @click="updateContacts" class="save-contacts-button">
                Сохранить контакты
              </button>
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
                <label>Изображения проекта (можно выбрать несколько) <span class="required">*</span></label>
                <input type="file" accept="image/*" multiple @change="handleProjectFiles" class="form-input" required>
                <small>Максимум 10 изображений. Минимум 1 изображение обязательно</small>
                <small v-if="newProject.images.length === 0" class="error-text">Необходимо добавить хотя бы одно
                  изображение</small>
              </div>

              <div v-if="newProject.images.length" class="image-previews">
                <div v-for="(image, index) in newProject.images" :key="index" class="image-preview-item">
                  <img :src="image" alt="Превью" class="preview-image">
                  <button @click="newProject.images.splice(index, 1)" class="remove-image-button">
                    <i class="fas fa-times">X</i>
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
                  <button v-if="isOwnProfile" @click.stop="removeProject(project.id)" class="project-delete-button">
                    <i class="fas fa-trash">X</i>
                  </button>
                </div>
                <div class="project-info">
                  <h3 class="project-title" :title="project.title || 'Без названия'">
                    {{ project.title || 'Без названия' }}
                  </h3>
                  <p class="project-type">{{ project.type || 'Тип не указан' }}</p>

                  <!-- Описание проекта с ограничением -->
                  <div v-if="project.description" class="project-description-container">
                    <p :class="{ 'project-description-collapsed': !isProjectExpanded(project.id) && project.description.length > 120 }"
                      class="project-description">
                      {{ isProjectExpanded(project.id) ? project.description : project.description.slice(0, 120) +
                        (project.description.length > 120 ? '...' : '') }}
                    </p>
                    <div v-if="project.description.length > 120" class="project-read-more">
                      <button @click.stop="toggleProjectDescription(project.id)" class="project-read-more-button">
                        {{ isProjectExpanded(project.id) ? 'Свернуть' : 'Читать далее' }}
                      </button>
                    </div>
                  </div>

                  <p class="project-date">{{ new Date(project.date).toLocaleDateString() || 'Дата не указана' }}</p>
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
  </div>
  <Footer />
</template>
<style scoped lang="scss">
@import "./profile.scss";

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