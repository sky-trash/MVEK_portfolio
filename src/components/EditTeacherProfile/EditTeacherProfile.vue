<script setup lang="ts">
import Header from '../layouts/header/header.vue'
import Footer from '../layouts/footer/footer.vue'
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { 
  doc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs
} from 'firebase/firestore'
import { db, auth } from '@/firebase'

const router = useRouter()
const loading = ref(true)
const isSaving = ref(false)
const errorMessage = ref('')
const saveErrorMessage = ref('')
const saveSuccessMessage = ref('')

// Данные из Firestore
const specialties = ref<string[]>([])
const allGroups = ref<any[]>([])
const isDataLoading = ref(true)

const formData = ref({
  name: '',
  surname: '',
  lname: '',
  login: '',
  email: '',
  position: '',
  experience: 0,
  specialization: '',
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
    // Загрузка специализаций
    const specialtiesQuery = query(collection(db, 'specialties'))
    const specialtiesSnapshot = await getDocs(specialtiesQuery)
    specialties.value = specialtiesSnapshot.docs.map(doc => doc.data().name)

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
      experience: userData.experience || 0,
      specialization: userData.specialization || '',
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
        !formData.value.position || !formData.value.specialization || !formData.value.bio) {
      saveErrorMessage.value = 'Заполните все обязательные поля'
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
      experience: Number(formData.value.experience),
      specialization: formData.value.specialization,
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
          updatedAt: new Date()
        })
      } else if (group.teacherId === user.uid) {
        await updateDoc(groupRef, {
          teacherId: null,
          teacherName: null,
          updatedAt: new Date()
        })
      }
    }

    saveSuccessMessage.value = 'Профиль успешно сохранен!'
    setTimeout(() => {
      router.push('/teacherProfile')
    }, 1500)

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
              <input v-model="formData.position" type="text" required placeholder="Преподаватель, Старший преподаватель и т.д.">
            </div>
          </div>

          <div class="form-section">
            <h2>Профессиональная информация</h2>
            
            <div class="form-row">
              <div class="form-group">
                <label>Стаж работы (лет) *</label>
                <input v-model="formData.experience" type="number" min="0" required>
              </div>
              
              <div class="form-group">
                <label>Специализация *</label>
                <select v-model="formData.specialization" required :disabled="isDataLoading">
                  <option value="">Выберите специализацию</option>
                  <option v-for="specialty in specialties" :key="specialty" :value="specialty">
                    {{ specialty }}
                  </option>
                </select>
                <div v-if="isDataLoading" class="loading-text">Загрузка специализаций...</div>
              </div>
            </div>
          </div>

          <div class="form-section">
            <h2>Кураторство групп</h2>
            
            <div class="form-group">
              <label>Выберите группы для кураторства</label>
              <select 
                v-model="formData.curatedGroups" 
                multiple 
                :disabled="isDataLoading"
                class="groups-select"
              >
                <option 
                  v-for="group in allGroups" 
                  :key="group.id" 
                  :value="group.id"
                  :disabled="group.teacherId && group.teacherId !== auth.currentUser?.uid"
                >
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
                  <span 
                    v-for="groupId in formData.curatedGroups" 
                    :key="groupId" 
                    class="selected-group-tag"
                  >
                    {{ allGroups.find(g => g.id === groupId)?.name }}
                    <button 
                      type="button" 
                      @click="formData.curatedGroups = formData.curatedGroups.filter(id => id !== groupId)"
                      class="remove-group-btn"
                    >
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
              <textarea v-model="formData.bio" rows="4" required placeholder="Расскажите о своем профессиональном опыте, образовании и достижениях..."></textarea>
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
          
          <div v-if="saveSuccessMessage" class="success-message">
            {{ saveSuccessMessage }}
          </div>
        </form>
      </div>
    </main>
    <Footer />
  </div>
</template>

<style scoped>
/* Стили для выпадающего списка групп */
.groups-select {
  width: 100%;
  padding: 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 1rem;
  background: white;
  min-height: 150px;
  transition: border-color 0.3s ease;
}

.groups-select:focus {
  outline: none;
  border-color: #4a6cf7;
  box-shadow: 0 0 0 3px rgba(74, 108, 247, 0.1);
}

.groups-select:disabled {
  background-color: #f7fafc;
  cursor: not-allowed;
}

.select-note {
  display: block;
  margin-top: 0.5rem;
  color: #718096;
  font-size: 0.9rem;
  font-style: italic;
}

.selected-groups {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 12px;
  border: 2px solid #e2e8f0;
}

.selected-groups h3 {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  color: #2d3748;
  font-weight: 600;
}

.selected-groups-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.selected-group-tag {
  background: linear-gradient(135deg, #4a6cf7 0%, #667eea 100%);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 2px 8px rgba(74, 108, 247, 0.3);
}

.remove-group-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: bold;
  padding: 0.1rem 0.4rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.3s ease;
  line-height: 1;
}

.remove-group-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* Остальные стили остаются без изменений */
.edit-profile-page {
  min-height: 100vh;
  padding: 2rem 0;
  background: #f7fafc;
}

.edit-profile-container {
  max-width: 900px;
  margin: 0 auto;
  background: white;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.edit-profile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.edit-profile-header h1 {
  margin: 0;
  font-size: 2rem;
}

.back-button {
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
}

.back-button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.edit-profile-form {
  padding: 2rem;
}

.form-section {
  margin-bottom: 2.5rem;
  padding-bottom: 2rem;
  border-bottom: 2px solid #e2e8f0;
}

.form-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.form-section h2 {
  color: #2d3748;
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #4a6cf7;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #2d3748;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #4a6cf7;
  box-shadow: 0 0 0 3px rgba(74, 108, 247, 0.1);
}

.form-group input:disabled {
  background-color: #f7fafc;
  color: #718096;
  cursor: not-allowed;
}

.disabled-note {
  display: block;
  margin-top: 0.5rem;
  color: #718096;
  font-size: 0.9rem;
}

.loading-text {
  color: #718096;
  font-style: italic;
  margin-top: 0.5rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 2px solid #e2e8f0;
}

.cancel-button {
  background: transparent;
  border: 2px solid #e2e8f0;
  color: #718096;
  padding: 1rem 2rem;
  border-radius: 25px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-button:hover {
  background: #f7fafc;
  transform: translateY(-2px);
}

.save-button {
  background: linear-gradient(135deg, #4a6cf7 0%, #667eea 100%);
  color: white;
  border: none;
  border-radius: 25px;
  padding: 1rem 2rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.save-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(74, 108, 247, 0.4);
}

.save-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.error-message {
  background: #fed7d7;
  color: #c53030;
  padding: 1rem;
  border-radius: 12px;
  margin-top: 1rem;
  border-left: 4px solid #f56565;
}

.success-message {
  background: #c6f6d5;
  color: #2f855a;
  padding: 1rem;
  border-radius: 12px;
  margin-top: 1rem;
  border-left: 4px solid #48bb78;
}

.loading-spinner {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 3rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(74, 108, 247, 0.1);
  border-top: 4px solid #4a6cf7;
  border-radius: 50%;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .edit-profile-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .form-row {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .form-actions {
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .edit-profile-container {
    margin: 1rem;
    border-radius: 16px;
  }

  .edit-profile-form {
    padding: 1.5rem;
  }

  .form-section {
    margin-bottom: 2rem;
    padding-bottom: 1.5rem;
  }

  .selected-groups-list {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
<style scoped>
@import "./EditTeacherProfile.scss";
</style>