<script setup lang="ts">
import Header from '../layouts/header/header.vue'
import Footer from '../layouts/footer/footer.vue'
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { 
  doc, getDoc, updateDoc, arrayUnion, arrayRemove,
  collection, addDoc, query, where, getDocs, orderBy, onSnapshot,
  setDoc, increment, serverTimestamp
} from 'firebase/firestore'
import { db, auth } from '@/firebase'
import { onAuthStateChanged } from 'firebase/auth'

const route = useRoute()
const router = useRouter()
const project = ref<any>(null)
const isLoading = ref(true)
const error = ref('')
const currentUser = ref<any>(null)
const isAuthenticated = ref(false)

// Состояния для взаимодействий
const userRating = ref(0)
const userLike = ref(false)
const userInCart = ref(false)
const newComment = ref('')
const comments = ref<any[]>([])
const userCommentLikes = ref<Set<string>>(new Set())

// Загрузка данных проекта
const loadProjectData = async () => {
  try {
    const projectId = route.params.id as string
    const projectDoc = await getDoc(doc(db, 'projects', projectId))
    
    if (projectDoc.exists()) {
      project.value = { id: projectDoc.id, ...projectDoc.data() }
      await loadUserInteractions()
      await loadComments()
      
      // Увеличиваем счетчик просмотров
      await updateDoc(doc(db, 'projects', projectId), {
        views: increment(1)
      })
    } else {
      error.value = 'Проект не найден'
    }
  } catch (err) {
    console.error('Ошибка загрузки проекта:', err)
    error.value = 'Ошибка при загрузке проекта'
  } finally {
    isLoading.value = false
  }
}

// Загрузка пользовательских взаимодействий
const loadUserInteractions = async () => {
  if (!currentUser.value) return

  try {
    const userInteractionsRef = doc(db, 'userInteractions', currentUser.value.uid)
    const userInteractionsDoc = await getDoc(userInteractionsRef)
    
    if (userInteractionsDoc.exists()) {
      const data = userInteractionsDoc.data()
      userRating.value = data.ratings?.[project.value.id] || 0
      userLike.value = data.likes?.includes(project.value.id) || false
      userInCart.value = data.cart?.includes(project.value.id) || false
      
      // Загружаем лайки комментариев
      if (data.commentLikes) {
        userCommentLikes.value = new Set(data.commentLikes)
      }
    }
  } catch (err) {
    console.error('Ошибка загрузки взаимодействий:', err)
  }
}

// Загрузка комментариев
const loadComments = async () => {
  try {
    const commentsQuery = query(
      collection(db, 'comments'),
      where('projectId', '==', project.value.id),
      orderBy('createdAt', 'desc')
    )
    
    const querySnapshot = await getDocs(commentsQuery)
    comments.value = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    // Также подписываемся на реальные обновления
    const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
      comments.value = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    })

    return unsubscribe
  } catch (err) {
    console.error('Ошибка загрузки комментариев:', err)
    comments.value = []
  }
}

// Создание или обновление документа пользовательских взаимодействий
const updateUserInteractions = async (updates: any) => {
  if (!currentUser.value) return

  try {
    const userInteractionsRef = doc(db, 'userInteractions', currentUser.value.uid)
    await setDoc(userInteractionsRef, updates, { merge: true })
  } catch (err) {
    console.error('Ошибка обновления взаимодействий:', err)
    throw err
  }
}

// Оценка проекта (только один раз)
const rateProject = async (rating: number) => {
  if (!isAuthenticated.value) {
    alert('Для оценки необходимо авторизоваться')
    return
  }

  // Если пользователь уже оценил проект, запрещаем изменение
  if (userRating.value > 0) {
    alert('Вы уже оценили этот проект. Изменение оценки невозможно.')
    return
  }

  try {
    const projectRef = doc(db, 'projects', project.value.id)

    // Обновляем взаимодействия пользователя
    await updateUserInteractions({
      [`ratings.${project.value.id}`]: rating
    })

    // Обновляем общий рейтинг проекта
    await updateDoc(projectRef, {
      totalRating: increment(rating),
      ratingCount: increment(1)
    })

    userRating.value = rating

    // Обновляем данные проекта
    const updatedProjectDoc = await getDoc(projectRef)
    if (updatedProjectDoc.exists()) {
      project.value = { id: updatedProjectDoc.id, ...updatedProjectDoc.data() }
    }

  } catch (err) {
    console.error('Ошибка оценки:', err)
    alert('Ошибка при оценке проекта')
  }
}

// Лайк проекта
const toggleLike = async () => {
  if (!isAuthenticated.value) {
    alert('Для лайков необходимо авторизоваться')
    return
  }

  try {
    const projectRef = doc(db, 'projects', project.value.id)

    if (userLike.value) {
      // Удаляем лайк
      await updateUserInteractions({
        likes: arrayRemove(project.value.id)
      })
      await updateDoc(projectRef, {
        likes: increment(-1)
      })
      userLike.value = false
    } else {
      // Добавляем лайк
      await updateUserInteractions({
        likes: arrayUnion(project.value.id)
      })
      await updateDoc(projectRef, {
        likes: increment(1)
      })
      userLike.value = true
    }

    // Обновляем данные проекта
    const updatedProjectDoc = await getDoc(projectRef)
    if (updatedProjectDoc.exists()) {
      project.value = { id: updatedProjectDoc.id, ...updatedProjectDoc.data() }
    }

  } catch (err) {
    console.error('Ошибка лайка:', err)
    alert('Ошибка при лайке проекта')
  }
}

// Добавление в корзину
const toggleCart = async () => {
  if (!isAuthenticated.value) {
    alert('Для добавления в корзину необходимо авторизоваться')
    return
  }

  try {
    if (userInCart.value) {
      await updateUserInteractions({
        cart: arrayRemove(project.value.id)
      })
      userInCart.value = false
    } else {
      await updateUserInteractions({
        cart: arrayUnion(project.value.id)
      })
      userInCart.value = true
    }

  } catch (err) {
    console.error('Ошибка корзины:', err)
    alert('Ошибка при работе с корзиной')
  }
}

// Добавление комментария
const addComment = async () => {
  if (!isAuthenticated.value) {
    alert('Для комментариев необходимо авторизоваться')
    return
  }

  if (!newComment.value.trim()) {
    alert('Комментарий не может быть пустым')
    return
  }

  try {
    // Получаем данные пользователя из коллекции users
    let userName = 'Аноним'
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.value.uid))
      if (userDoc.exists()) {
        const userData = userDoc.data()
        userName = [userData.surname, userData.name, userData.lname]
          .filter(Boolean)
          .join(' ') || currentUser.value.displayName || 'Аноним'
      }
    } catch (userErr) {
      console.error('Ошибка получения данных пользователя:', userErr)
      userName = currentUser.value.displayName || 'Аноним'
    }

    await addDoc(collection(db, 'comments'), {
      projectId: project.value.id,
      userId: currentUser.value.uid,
      userName: userName,
      userAvatar: currentUser.value.photoURL || '/placeholder-avatar.png',
      text: newComment.value.trim(),
      createdAt: serverTimestamp(),
      likes: 0,
      likedBy: []
    })

    newComment.value = ''
    
    // Перезагружаем комментарии
    await loadComments()

  } catch (err) {
    console.error('Ошибка комментария:', err)
    alert('Ошибка при добавлении комментария')
  }
}

// Лайк комментария
const toggleCommentLike = async (comment: any) => {
  if (!isAuthenticated.value) {
    alert('Для лайка комментариев необходимо авторизоваться')
    return
  }

  try {
    const commentRef = doc(db, 'comments', comment.id)
    const isLiked = userCommentLikes.value.has(comment.id)

    if (isLiked) {
      // Удаляем лайк
      await updateDoc(commentRef, {
        likes: increment(-1),
        likedBy: arrayRemove(currentUser.value.uid)
      })
      userCommentLikes.value.delete(comment.id)
    } else {
      // Добавляем лайк
      await updateDoc(commentRef, {
        likes: increment(1),
        likedBy: arrayUnion(currentUser.value.uid)
      })
      userCommentLikes.value.add(comment.id)
    }

    // Сохраняем лайки комментариев пользователя
    await updateUserInteractions({
      commentLikes: Array.from(userCommentLikes.value)
    })

    // Обновляем комментарии
    await loadComments()

  } catch (err) {
    console.error('Ошибка лайка комментария:', err)
    alert('Ошибка при лайке комментария')
  }
}

// Проверка, лайкнул ли пользователь комментарий
const isCommentLiked = (commentId: string) => {
  return userCommentLikes.value.has(commentId)
}

// Назад к проектам
const goBack = () => {
  router.push('/projects')
}

// Вычисляемые свойства
const averageRating = computed(() => {
  if (!project.value || !project.value.ratingCount || project.value.ratingCount === 0) return 0
  return (project.value.totalRating / project.value.ratingCount).toFixed(1)
})

const starRating = computed(() => {
  return Math.round(parseFloat(averageRating.value))
})

// Форматирование даты комментария
const formatCommentDate = (date: any) => {
  if (!date) return 'Дата не указана'
  
  try {
    // Если date - это объект timestamp Firebase
    if (date && typeof date === 'object' && date.seconds) {
      return new Date(date.seconds * 1000).toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
    
    // Если date - это строка
    if (typeof date === 'string') {
      return new Date(date).toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
    
    return 'Дата не указана'
  } catch {
    return 'Дата не указана'
  }
}

onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUser.value = user
      isAuthenticated.value = true
    } else {
      currentUser.value = null
      isAuthenticated.value = false
    }
    loadProjectData()
  })
})
</script>

<template>
  <Header/>
  <div class="project-details">
    <!-- Кнопка назад -->
    <div class="back-button-container">
      <button @click="goBack" class="back-button">
        ← Назад к проектам
      </button>
    </div>

    <div v-if="isLoading" class="loading">Загрузка...</div>
    
    <div v-else-if="error" class="error">
      {{ error }}
    </div>
    
    <div v-else-if="project" class="project-content">
      <!-- Заголовок и мета-информация -->
      <div class="project-header">
        <h1>{{ project.title }}</h1>
        <div class="project-actions">
          <button @click="toggleLike" :class="['like-btn', { liked: userLike }]">
            ❤️ {{ project.likes || 0 }}
          </button>
          <button @click="toggleCart" :class="['cart-btn', { 'in-cart': userInCart }]">
            {{ userInCart ? '🗑️ Из корзины' : '🛒 В корзину' }}
          </button>
        </div>
      </div>

      <div class="project-meta">
        <span class="author">Автор: {{ project.authorName }}</span>
        <span class="type">Тип: {{ project.type }}</span>
        <span class="date">Дата: {{ new Date(project.date).toLocaleDateString() }}</span>
      </div>

      <!-- Рейтинг -->
      <div class="rating-section">
        <h3>Оценка проекта</h3>
        <div class="rating-display">
          <span class="average-rating">{{ averageRating }}</span>
          <div class="stars">
            <span v-for="star in 5" :key="star" class="star">
              {{ star <= starRating ? '⭐' : '☆' }}
            </span>
          </div>
          <span class="rating-count">({{ project.ratingCount || 0 }} оценок)</span>
        </div>
        
        <div v-if="isAuthenticated" class="rating-input">
          <span>Ваша оценка:</span>
          <div class="star-rating">
            <button
              v-for="rating in 5"
              :key="rating"
              @click="rateProject(rating)"
              :class="['star-btn', { active: rating <= userRating, disabled: userRating > 0 }]"
              :disabled="userRating > 0"
            >
              {{ rating <= userRating ? '⭐' : '☆' }}
            </button>
          </div>
          <div v-if="userRating > 0" class="rating-info">
            <small>Вы уже оценили этот проект</small>
          </div>
        </div>
        <div v-else class="auth-prompt">
          <router-link to="/auth">Войдите</router-link> чтобы оценить проект
        </div>
      </div>

      <!-- Описание -->
      <div class="project-description">
        <h3>Описание</h3>
        <p>{{ project.description }}</p>
      </div>

      <!-- Изображения -->
      <div v-if="project.images && project.images.length" class="project-images">
        <h3>Галерея проекта</h3>
        <div class="images-grid">
          <div v-for="(image, index) in project.images" :key="index" class="image-item">
            <img :src="image" :alt="`${project.title} - изображение ${index + 1}`">
          </div>
        </div>
      </div>

      <!-- Статистика -->
      <div class="project-stats">
        <span class="views">👁️ {{ project.views || 0 }} просмотров</span>
        <span class="likes">❤️ {{ project.likes || 0 }} лайков</span>
        <span class="rating">⭐ {{ averageRating }} средняя оценка</span>
      </div>

      <!-- Комментарии -->
      <div class="comments-section">
        <h3>Комментарии ({{ comments.length }})</h3>
        
        <!-- Форма добавления комментария -->
        <div v-if="isAuthenticated" class="comment-form">
          <textarea
            v-model="newComment"
            placeholder="Оставьте ваш отзыв..."
            rows="3"
            class="comment-input"
          ></textarea>
          <button @click="addComment" :disabled="!newComment.trim()" class="comment-submit">
            Отправить
          </button>
        </div>
        <div v-else class="auth-prompt">
          <router-link to="/auth">Войдите</router-link> чтобы оставить комментарий
        </div>

        <!-- Список комментариев -->
        <div v-if="comments.length" class="comments-list">
          <div v-for="comment in comments" :key="comment.id" class="comment-item">
            <div class="comment-header">
              <img src="../../../public/logo.png" class="comment-avatar">
              <div class="comment-user">
                <strong>{{ comment.userName }}</strong>
                <span class="comment-date">
                  {{ formatCommentDate(comment.createdAt) }}
                </span>
              </div>
            </div>
            <p class="comment-text">{{ comment.text }}</p>
            <div class="comment-actions">
              <button 
                @click="toggleCommentLike(comment)" 
                :class="['comment-like', { liked: isCommentLiked(comment.id) }]"
              >
                ❤️ {{ comment.likes || 0 }}
              </button>
            </div>
          </div>
        </div>
        <div v-else class="no-comments">
          <p>Пока нет комментариев. Будьте первым!</p>
        </div>
      </div>
    </div>
  </div>
  <Footer/>
</template>
<style scoped lang="scss">
@import "./projectDetails.scss";

.back-button-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 2rem;
}

.back-button {
  padding: 0.5rem 1rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.3s ease;
}

.back-button:hover {
  background: #5a6fd8;
}

/* Добавляем стили для disabled кнопок */
.star-btn.disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.star-btn.disabled:hover {
  transform: none;
}

.rating-info {
  margin-top: 0.5rem;
  color: #666;
  font-size: 0.9rem;
}

.comment-like.liked {
  color: #ff4757;
}

.comment-like.liked:hover {
  color: #ff3742;
}

/* Улучшаем отображение комментариев */
.comments-list {
  margin-top: 1rem;
}

.comment-item {
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  background: #fafafa;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.comment-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.comment-user {
  display: flex;
  flex-direction: column;
}

.comment-user strong {
  font-size: 0.9rem;
}

.comment-date {
  font-size: 0.8rem;
  color: #666;
}

.comment-text {
  margin: 0;
  line-height: 1.4;
}

.comment-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 0.5rem;
}
/* Добавляем стили для disabled кнопок */
.star-btn.disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.star-btn.disabled:hover {
  transform: none;
}

.rating-info {
  margin-top: 0.5rem;
  color: #666;
  font-size: 0.9rem;
}

.comment-like.liked {
  color: #ff4757;
}

.comment-like.liked:hover {
  color: #ff3742;
}
</style>