<script setup lang="ts">
import Header from '../layouts/header/header.vue'
import Footer from '../layouts/footer/footer.vue'
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  doc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc
} from 'firebase/firestore'
import { db, auth } from '@/firebase'

const router = useRouter()
const loading = ref(true)
const isSaving = ref(false)
const errorMessage = ref('')
const saveErrorMessage = ref('')
const saveSuccessMessage = ref('')

// Данные из Firestore
const specialties = ref<string[]>([]) // Специализации из коллекции specialties
const departments = ref<string[]>([]) // Кафедры (будут создаваться на основе специализаций)
const allGroups = ref<any[]>([])
const isDataLoading = ref(true)

const formData = ref({
  name: '',
  surname: '',
  lname: '',
  login: '',
  email: '',
  position: '',
  department: '', // Кафедра (сохраняется в users)
  specialization: '', // Специализация (из коллекции specialties)
  experience: 0,
  bio: '',
  socialLinks: {
    behance: '',
    dribbble: '',
    vk: ''
  },
  curatedGroups: [] as string[]
})

// Загрузка данных из Firestore
const loadFirestoreData = async () => {
  try {
    // Загрузка специализаций из коллекции specialties
    const specialtiesQuery = query(collection(db, 'specialties'))
    const specialtiesSnapshot = await getDocs(specialtiesQuery)
    if (!specialtiesSnapshot.empty) {
      specialties.value = specialtiesSnapshot.docs
        .map(doc => doc.data().name)
        .filter(name => name && name.trim() !== '')
        .sort((a, b) => a.localeCompare(b))
    } else {
      console.log('Коллекция specialties пуста или не существует')
      specialties.value = []
    }

    // Создаем кафедры на основе специализаций
    departments.value = createDepartmentsFromSpecialties(specialties.value)

    // Загрузка всех групп
    const groupsQuery = query(collection(db, 'groups'))
    const groupsSnapshot = await getDocs(groupsQuery)
    allGroups.value = groupsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

  } catch (error) {
    console.error('Ошибка загрузки данных:', error)
    errorMessage.value = 'Не удалось загрузить данные'
  } finally {
    isDataLoading.value = false
  }
}

// Создание кафедр на основе специализаций
const createDepartmentsFromSpecialties = (specialtiesList: string[]): string[] => {
  const departmentMap: Record<string, boolean> = {}

  // Базовые кафедры для дизайнерских специальностей
  const baseDepartments = [
    'Кафедра графического дизайна',
    'Кафедра веб-дизайна',
    'Кафедра промышленного дизайна',
    'Кафедра дизайна интерьера',
    'Кафедра дизайна',
    'Кафедра IT-разработки',
    'Кафедра дизайна по отраслям',
    'Кафедра дизайна пользовательского интерфейса'
  ]

  // Добавляем базовые кафедры
  baseDepartments.forEach(dept => {
    departmentMap[dept] = true
  })


  return Object.keys(departmentMap).sort((a, b) => a.localeCompare(b))
}

// Загрузка данных профиля преподавателя
const loadProfileData = async () => {
  try {
    const user = auth.currentUser
    if (!user) {
      errorMessage.value = 'Пользователь не авторизован'
      loading.value = false
      return
    }

    // Ищем пользователя в коллекции users
    const usersQuery = query(collection(db, 'users'), where('userId', '==', user.uid))
    const usersSnapshot = await getDocs(usersQuery)

    if (usersSnapshot.empty) {
      errorMessage.value = 'Профиль не найден'
      loading.value = false
      return
    }

    const userDoc = usersSnapshot.docs[0]
    const userData = userDoc.data()

    formData.value = {
      name: userData.name || '',
      surname: userData.surname || '',
      lname: userData.lname || '',
      login: userData.login || '',
      email: userData.email || '',
      position: userData.position || 'Преподаватель',
      department: userData.department || '',
      specialization: userData.specialization || '',
      experience: userData.experience || 0,
      bio: userData.bio || '',
      socialLinks: {
        behance: userData.socialLinks?.behance || '',
        dribbble: userData.socialLinks?.dribbble || '',
        vk: userData.socialLinks?.vk || ''
      },
      curatedGroups: userData.curatedGroups || []
    }

  } catch (error) {
    console.error('Ошибка загрузки профиля:', error)
    errorMessage.value = 'Ошибка при загрузке данных профиля'
  } finally {
    loading.value = false
  }
}

// Сохранение профиля преподавателя
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
    if (!formData.value.name || !formData.value.surname || !formData.value.login ||
      !formData.value.position || !formData.value.department || !formData.value.specialization || !formData.value.bio) {
      saveErrorMessage.value = 'Заполните все обязательные поля'
      return
    }

    // Проверяем, что выбранная специализация существует в базе
    if (!specialties.value.includes(formData.value.specialization)) {
      saveErrorMessage.value = 'Выбранная специализация не найдена в системе'
      return
    }

    // Ищем пользователя в коллекции users
    const usersQuery = query(collection(db, 'users'), where('userId', '==', user.uid))
    const usersSnapshot = await getDocs(usersQuery)

    if (usersSnapshot.empty) {
      saveErrorMessage.value = 'Профиль не найден'
      return
    }

    const userDoc = usersSnapshot.docs[0]
    const userRef = doc(db, 'users', userDoc.id)

    // Обновляем данные в коллекции users
    await updateDoc(userRef, {
      name: formData.value.name,
      surname: formData.value.surname,
      lname: formData.value.lname,
      login: formData.value.login,
      position: formData.value.position,
      department: formData.value.department, // Сохраняем кафедру
      specialization: formData.value.specialization, // Сохраняем специализацию
      experience: Number(formData.value.experience),
      bio: formData.value.bio,
      socialLinks: formData.value.socialLinks,
      curatedGroups: formData.value.curatedGroups,
      updatedAt: new Date()
    })

    // Обновляем кураторство в группах
    for (const group of allGroups.value) {
      const groupRef = doc(db, 'groups', group.id)
      if (formData.value.curatedGroups.includes(group.id)) {
        await updateDoc(groupRef, {
          teacherId: user.uid,
          teacherName: `${formData.value.surname} ${formData.value.name} ${formData.value.lname || ''}`.trim(),
          teacherDepartment: formData.value.department,
          updatedAt: new Date()
        })
      } else if (group.teacherId === user.uid) {
        await updateDoc(groupRef, {
          teacherId: null,
          teacherName: null,
          teacherDepartment: null,
          updatedAt: new Date()
        })
      }
    }

    // Вместо setTimeout с переходом, просто перезагружаем страницу
    window.location.href = '/teacherProfile'

  } catch (error) {
    console.error('Ошибка сохранения профиля:', error)
    saveErrorMessage.value = 'Ошибка при сохранении профиля'
  } finally {
    isSaving.value = false
  }
}

onMounted(() => {
  loadFirestoreData()
  loadProfileData()
})
</script>

<template>
  <div>
    <Header />
    <main class="edit-profile-page">
      <div class="edit-profile-container">
        <div class="edit-profile-header">
          <h1>Редактирование профиля преподавателя</h1>
          <button @click="$router.back()" class="back-button">
            <i class="fas fa-arrow-left"></i> Назад
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

            <div class="form-group">
              <label>Должность *</label>
              <input v-model="formData.position" type="text" required
                placeholder="Преподаватель, Старший преподаватель и т.д.">
            </div>
          </div>

          <div class="form-section">
            <h2>Профессиональная информация</h2>

            <div class="form-row">
              <div class="form-group">
                <label>Кафедра *</label>
                <select v-model="formData.department" required>
                  <option value="">Выберите кафедру</option>
                  <option v-for="department in departments" :key="department" :value="department">
                    {{ department }}
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label>Специализация *</label>
                <select v-model="formData.specialization" required>
                  <option value="">Выберите специализацию</option>
                  <option v-for="specialty in specialties" :key="specialty" :value="specialty">
                    {{ specialty }}
                  </option>
                </select>
                <div v-if="isDataLoading" class="loading-text">Загрузка специализаций...</div>
              </div>
            </div>

            <div class="form-group">
              <label>Стаж работы (лет) *</label>
              <input v-model="formData.experience" type="number" min="0" required>
            </div>
          </div>

          <div class="form-section">
            <h2>Кураторство групп</h2>

            <div class="form-group">
              <label>Выберите группы для кураторства</label>
              <select v-model="formData.curatedGroups" multiple :disabled="isDataLoading" class="groups-select">
                <option v-for="group in allGroups" :key="group.id" :value="group.id"
                  :disabled="group.teacherId && group.teacherId !== auth.currentUser?.uid">
                  {{ group.name }}
                  <span v-if="group.teacherId && group.teacherId !== auth.currentUser?.uid">
                    (Занято: {{ group.teacherName }})
                  </span>
                </option>
              </select>
              <small class="select-note">Для выбора нескольких групп удерживайте Ctrl (Cmd на Mac)</small>
              <div v-if="isDataLoading" class="loading-text">Загрузка групп...</div>

              <div v-if="formData.curatedGroups.length > 0" class="selected-groups">
                <h3>Выбранные группы:</h3>
                <div class="selected-groups-list">
                  <span v-for="groupId in formData.curatedGroups" :key="groupId" class="selected-group-tag">
                    {{allGroups.find(g => g.id === groupId)?.name}}
                    <button type="button"
                      @click="formData.curatedGroups = formData.curatedGroups.filter(id => id !== groupId)"
                      class="remove-group-btn">
                      ×
                    </button>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="form-section">
            <h2>О себе</h2>

            <div class="form-group">
              <label>Биография *</label>
              <textarea v-model="formData.bio" rows="4" required
                placeholder="Расскажите о своем профессиональном опыте, образовании и достижениях..."></textarea>
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
@import "./EditTeacherProfile.scss";
</style>