<script setup lang="ts">
import Header from '../layouts/header/header.vue'
import Footer from '../layouts/footer/footer.vue'
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { doc, getDoc, updateDoc, collection, getDocs, where, query } from 'firebase/firestore'
import { db, auth, storage } from '@/firebase'

const router = useRouter()
const loading = ref(true)
const isSaving = ref(false)
const isDataLoading = ref(true)
const isUploadingAvatar = ref(false)
const errorMessage = ref('')
const saveErrorMessage = ref('')
const saveSuccessMessage = ref('')
const newSkill = ref('')

const groups = ref<string[]>([])
const specialties = ref<string[]>([])

const formData = ref({
  name: '',
  surname: '',
  lname: '',
  login: '',
  email: '',
  group: '',
  specialty: '',
  bio: '',
  avatarUrl: '',
  socialLinks: {
    behance: '',
    dribbble: '',
    vk: ''
  },
  skills: [] as string[]
})

// Загрузка групп и специальностей
const loadGroupsAndSpecialties = async () => {
  try {
    // Загрузка групп
    const groupsQuery = query(collection(db, 'groups'))
    const groupsSnapshot = await getDocs(groupsQuery)
    groups.value = groupsSnapshot.docs.map(doc => doc.data().name)

    // Загрузка специальностей
    const specialtiesQuery = query(collection(db, 'specialties'))
    const specialtiesSnapshot = await getDocs(specialtiesQuery)
    specialties.value = specialtiesSnapshot.docs.map(doc => doc.data().name)
  } catch (error) {
    console.error('Ошибка загрузки данных:', error)
    errorMessage.value = 'Не удалось загрузить список групп и специальностей'
  } finally {
    isDataLoading.value = false
  }
}

// Загрузка данных профиля
const loadProfileData = async () => {
  try {
    const user = auth.currentUser
    if (!user) {
      errorMessage.value = 'Пользователь не авторизован'
      loading.value = false
      return
    }

    // Поиск документа пользователя
    const usersQuery = query(collection(db, 'users'), where('userId', '==', user.uid))
    const querySnapshot = await getDocs(usersQuery)
    
    if (querySnapshot.empty) {
      errorMessage.value = 'Профиль не найден'
      loading.value = false
      return
    }

    const userDoc = querySnapshot.docs[0]
    const userData = userDoc.data()

    formData.value = {
      name: userData.name || '',
      surname: userData.surname || '',
      lname: userData.lname || '',
      login: userData.login || '',
      email: userData.email || '',
      group: userData.group || '',
      specialty: userData.specialty || '',
      bio: userData.bio || '',
      avatarUrl: userData.avatarUrl || '',
      socialLinks: {
        behance: userData.socialLinks?.behance || '',
        dribbble: userData.socialLinks?.dribbble || '',
        vk: userData.socialLinks?.vk || ''
      },
      skills: userData.skills || []
    }

  } catch (error) {
    console.error('Ошибка загрузки профиля:', error)
    errorMessage.value = 'Ошибка при загрузке данных профиля'
  } finally {
    loading.value = false
  }
}

// Управление навыками
const addSkill = () => {
  if (newSkill.value.trim() && !formData.value.skills.includes(newSkill.value.trim())) {
    formData.value.skills.push(newSkill.value.trim())
    newSkill.value = ''
  }
}

const removeSkill = (index: number) => {
  formData.value.skills.splice(index, 1)
}

// Сохранение профиля
const saveProfile = async () => {
  try {
    isSaving.value = true
    saveErrorMessage.value = ''
    saveSuccessMessage.value = ''

    const user = auth.currentUser
    if (!user) {
      saveErrorMessage.value = 'Пользователь не авторизован'
      return
    }

    // Валидация
    if (!formData.value.name || !formData.value.surname || !formData.value.login) {
      saveErrorMessage.value = 'Заполните обязательные поля'
      return
    }

    // Поиск документа пользователя
    const usersQuery = query(collection(db, 'users'), where('userId', '==', user.uid))
    const querySnapshot = await getDocs(usersQuery)
    
    if (querySnapshot.empty) {
      saveErrorMessage.value = 'Профиль не найден'
      return
    }

    const userDoc = querySnapshot.docs[0]
    const userRef = doc(db, 'users', userDoc.id)

    await updateDoc(userRef, {
      name: formData.value.name,
      surname: formData.value.surname,
      lname: formData.value.lname,
      login: formData.value.login,
      group: formData.value.group,
      specialty: formData.value.specialty,
      bio: formData.value.bio,
      avatarUrl: formData.value.avatarUrl,
      socialLinks: formData.value.socialLinks,
      skills: formData.value.skills,
      updatedAt: new Date()
    })

    // Вместо setTimeout с переходом, просто перезагружаем страницу
    window.location.href = '/profile'

  } catch (error) {
    console.error('Ошибка сохранения профиля:', error)
    saveErrorMessage.value = 'Ошибка при сохранении профиля'
  } finally {
    isSaving.value = false
  }
}

onMounted(() => {
  loadGroupsAndSpecialties()
  loadProfileData()
})
</script>
<template>
  <div>
    <Header />
    <main class="edit-profile-page">
      <div class="edit-profile-container">
        <div class="edit-profile-header">
          <h1>Редактирование профиля</h1>
          <button @click="$router.back()" class="back-button">
            Назад
          </button>
        </div>

        <div v-if="loading" class="loading-spinner">
          <div class="spinner"></div>
        </div>

        <div v-else-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <form v-else @submit.prevent="saveProfile" class="edit-profile-form">
          <div class="form-section">
            <h2>Основная информация</h2>
            
            <div class="form-row">
              <div class="form-group">
                <label>Имя *</label>
                <input v-model="formData.name" type="text" required>
              </div>
              
              <div class="form-group">
                <label>Фамилия *</label>
                <input v-model="formData.surname" type="text" required>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Отчество</label>
                <input v-model="formData.lname" type="text">
              </div>
              
              <div class="form-group">
                <label>Логин *</label>
                <input v-model="formData.login" type="text" required>
              </div>
            </div>

            <div class="form-group">
              <label>Email *</label>
              <input v-model="formData.email" type="email" required disabled>
              <small class="disabled-note">Email нельзя изменить</small>
            </div>
          </div>

          <div class="form-section">
            <h2>Учебная информация</h2>
            
            <div class="form-row">
              <div class="form-group">
                <label>Группа *</label>
                <select v-model="formData.group" required :disabled="isDataLoading">
                  <option value="">Выберите группу</option>
                  <option v-for="group in groups" :key="group" :value="group">
                    {{ group }}
                  </option>
                </select>
                <div v-if="isDataLoading" class="loading-text">Загрузка групп...</div>
              </div>
              
              <div class="form-group">
                <label>Специальность *</label>
                <select v-model="formData.specialty" required :disabled="isDataLoading">
                  <option value="">Выберите специальность</option>
                  <option v-for="specialty in specialties" :key="specialty" :value="specialty">
                    {{ specialty }}
                  </option>
                </select>
                <div v-if="isDataLoading" class="loading-text">Загрузка специальностей...</div>
              </div>
            </div>
          </div>

          <div class="form-section">
            <h2>О себе</h2>
            
            <div class="form-group">
              <label>Биография</label>
              <textarea v-model="formData.bio" rows="4" placeholder="Расскажите о себе, своих интересах и достижениях..."></textarea>
            </div>
          </div>

          <div class="form-section">
            <h2>Социальные сети</h2>
            
            <div class="form-group">
              <label>Behance</label>
              <input v-model="formData.socialLinks.behance" type="url" placeholder="https://behance.net/ваш-профиль">
            </div>
            
            <div class="form-group">
              <label>Dribbble</label>
              <input v-model="formData.socialLinks.dribbble" type="url" placeholder="https://dribbble.com/ваш-профиль">
            </div>
            
            <div class="form-group">
              <label>ВКонтакте</label>
              <input v-model="formData.socialLinks.vk" type="url" placeholder="https://vk.com/ваш-профиль">
            </div>
          </div>

          <div class="form-section">
            <h2>Навыки</h2>
            
            <div class="skills-management">
              <div class="current-skills">
                <span v-for="(skill, index) in formData.skills" :key="index" class="skill-tag">
                  {{ skill }}
                  <button type="button" @click="removeSkill(index)" class="skill-remove">
                    <i class="fas fa-times">X</i>
                  </button>
                </span>
              </div>
              
              <div class="add-skill-form">
                <input v-model="newSkill" type="text" placeholder="Новый навык" class="skill-input">
                <button type="button" @click="addSkill" class="add-skill-button">
                  Добавить
                </button>
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" @click="$router.back()" class="cancel-button">
              Отмена
            </button>
            <button type="submit" :disabled="isSaving" class="save-button">
              <span v-if="!isSaving">Сохранить изменения</span>
              <span v-else class="loading-text">Сохранение...</span>
            </button>
          </div>

          <div v-if="saveErrorMessage" class="error-message">
            {{ saveErrorMessage }}
          </div>
        </form>
      </div>
    </main>
    <Footer />
  </div>
</template>
<style scoped>
@import "./EditProfile.scss";
</style>