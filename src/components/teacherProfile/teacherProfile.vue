<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ProjectCard from '@/components/projectCard/projectCard.vue'
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { db, auth } from '@/firebase'

interface Group {
  id: string
  name: string
  studentCount: number
}

interface Project {
  id: string
  title: string
  previewImage: string
  type: string
  rating: number
}

interface Teacher {
  id: string
  userId: string
  name: string
  position: string
  avatar?: string
  isVerified: boolean
  rating: number
  bio: string
  experience: number
  specialization: string
  email: string
  groups: Group[]
  projects: Project[]
}

const route = useRoute()
const router = useRouter()
const teacher = ref<Teacher | null>(null)
const loading = ref(true)
const isOwnProfile = ref(false)
const currentUserId = ref<string | null>(null)

// Получаем ID текущего пользователя
onMounted(() => {
  const user = auth.currentUser
  if (user) {
    currentUserId.value = user.uid
  }
})

// Функция для поиска преподавателя в коллекции users
const findTeacherInUsers = async (teacherId: string) => {
  try {
    // Пытаемся найти преподавателя в коллекции users
    const usersQuery = query(
      collection(db, 'users'), 
      where('role', '==', 'teacher'),
      where('userId', '==', teacherId)
    )
    
    const usersSnapshot = await getDocs(usersQuery)
    
    if (!usersSnapshot.empty) {
      const userDoc = usersSnapshot.docs[0]
      const userData = userDoc.data()
      
      // Создаем объект преподавателя из данных пользователя
      return {
        id: userDoc.id,
        userId: userData.userId,
        name: `${userData.surname} ${userData.name} ${userData.lname || ''}`.trim(),
        position: 'Преподаватель',
        avatar: userData.avatarUrl || '',
        isVerified: false,
        rating: 0,
        bio: '',
        experience: 0,
        specialization: '',
        email: userData.email,
        groups: [],
        projects: []
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
    // Сначала пытаемся найти в коллекции teachers
    const teacherDoc = await getDoc(doc(db, 'teachers', id))
    
    if (teacherDoc.exists()) {
      const teacherData = teacherDoc.data()
      
      // Получаем группы преподавателя
      const groupsQuery = query(collection(db, 'groups'), where('teacherId', '==', id))
      const groupsSnapshot = await getDocs(groupsQuery)
      const groups = groupsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Group[]

      // Получаем проекты преподавателя
      const projectsQuery = query(
        collection(db, 'projects'), 
        where('teacherId', '==', id),
        orderBy('createdAt', 'desc')
      )
      const projectsSnapshot = await getDocs(projectsQuery)
      const projects = projectsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Project[]

      return {
        id: teacherDoc.id,
        ...teacherData,
        groups,
        projects
      } as Teacher
    }
    
    // Если не нашли в teachers, ищем в users
    const teacherFromUsers = await findTeacherInUsers(id)
    if (teacherFromUsers) {
      return teacherFromUsers
    }
    
    throw new Error('Преподаватель не найден')
  } catch (error) {
    console.error('Ошибка загрузки данных преподавателя:', error)
    throw error
  }
}

onMounted(async () => {
  try {
    const teacherId = route.params.id as string
    
    // Если это личный профиль (/teacherProfile), используем ID текущего пользователя
    const targetId = route.name === 'teacherProfile' && currentUserId.value 
      ? currentUserId.value 
      : teacherId
    
    teacher.value = await fetchTeacherData(targetId)
    
    // Проверяем, является ли это профиль текущего пользователя
    if (currentUserId.value && teacher.value.userId === currentUserId.value) {
      isOwnProfile.value = true
    }
  } catch (error) {
    console.error('Ошибка загрузки данных:', error)
  } finally {
    loading.value = false
  }
})

const navigateToProject = (projectId: string) => {
  router.push(`/project/${projectId}`)
}

const editProfile = () => {
  if (teacher.value) {
    router.push(`/teacher/${teacher.value.id}/edit`)
  }
}
</script>

<template>
  <div class="teacher-profile-container">
    <div v-if="loading" class="loading-spinner">
      <div class="spinner"></div>
    </div>
    
    <div v-else-if="teacher" class="teacher-profile">
      <!-- Шапка профиля -->
      <div class="profile-header">
        <div class="avatar-container">
          <img 
            :src="teacher.avatar || '/default-teacher-avatar.jpg'" 
            :alt="teacher.name"
            class="avatar"
          >
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
              <span 
                v-for="n in 5" 
                :key="n" 
                :class="['star', { 'filled': n <= Math.round(teacher.rating) }]"
              >★</span>
            </div>
            <span class="rating-value">{{ teacher.rating.toFixed(1) }}</span>
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
              <span class="detail-label">Email:</span>
              <a :href="`mailto:${teacher.email}`" class="detail-value link">{{ teacher.email }}</a>
            </div>
          </div>
        </section>

        <!-- Курируемые группы -->
        <section class="groups-section" v-if="teacher.groups && teacher.groups.length > 0">
          <h2>Курируемые группы</h2>
          <div class="groups-grid">
            <router-link
              v-for="group in teacher.groups"
              :key="group.id"
              :to="`/students?group=${group.id}`"
              class="group-card"
            >
              <span class="group-name">{{ group.name }}</span>
              <span class="student-count">{{ group.studentCount }} студентов</span>
            </router-link>
          </div>
        </section>

        <!-- Студенческие проекты -->
        <section class="projects-section" v-if="teacher.projects && teacher.projects.length > 0">
          <h2>Руководство проектами</h2>
          <div class="projects-grid">
            <project-card
              v-for="project in teacher.projects"
              :key="project.id"
              :project="project"
              @click="navigateToProject(project.id)"
            />
          </div>
        </section>

        <!-- Сообщение, если нет групп или проектов -->
        <div v-if="(!teacher.groups || teacher.groups.length === 0) && 
                  (!teacher.projects || teacher.projects.length === 0)" 
             class="empty-state">
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
</template>

<style scoped lang="scss">
@import "./teacherProfile.scss";
</style>