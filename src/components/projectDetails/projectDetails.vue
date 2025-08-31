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
    const userInteractionsRef = doc(db, 'users', currentUser.value.uid)
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
    // Временное решение - загружаем все комментарии и фильтруем на клиенте
    const commentsQuery = query(
      collection(db, 'comments'),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(commentsQuery);

    // Фильтруем комментарии на стороне клиента
    comments.value = querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter(comment => comment.projectId === project.value.id);

    // Также подписываемся на реальные обновления
    const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
      comments.value = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(comment => comment.projectId === project.value.id);
    });

    return unsubscribe;
  } catch (err) {
    console.error('Ошибка загрузки комментариев:', err);

    // Альтернативный вариант - попробовать загрузить без фильтрации
    try {
      const allComments = await getDocs(collection(db, 'comments'));
      comments.value = allComments.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(comment => comment.projectId === project.value.id);
    } catch (fallbackErr) {
      console.error('Ошибка при альтернативной загрузке:', fallbackErr);
      comments.value = [];
    }
  }
};

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
      console.log('Данные пользователя из Firestore:', userDoc.exists() ? userDoc.data() : 'Документ не существует')
      
      if (userDoc.exists()) {
        const userData = userDoc.data()
        console.log('Все поля пользователя:', Object.keys(userData))
        
        // Проверяем различные возможные варианты полей
        if (userData.fullName) {
          userName = userData.fullName
        } else if (userData.displayName) {
          userName = userData.displayName
        } else if (userData.name && userData.surname) {
          userName = `${userData.surname} ${userData.name}${userData.lname ? ' ' + userData.lname : ''}`
        } else if (userData.name) {
          userName = userData.name
        } else if (userData.email) {
          userName = userData.email.split('@')[0] // Используем часть email до @
        }
        
        console.log('Выбранное имя пользователя:', userName)
      }
    } catch (userErr) {
      console.error('Ошибка получения данных пользователя:', userErr)
      // Используем displayName из auth или часть email
      userName = currentUser.value.displayName || 
                currentUser.value.email?.split('@')[0] || 
                'Аноним'
    }

    console.log('Имя для комментария:', userName)

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
  <Header />
  <div class="project-details">
    <!-- Кнопка назад -->
    <div class="back-button-container">
      <button @click="goBack" class="back-button">
        <span class="back-icon">←</span>
        Назад к проектам
      </button>
    </div>

    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Загрузка проекта...</p>
    </div>

    <div v-else-if="error" class="error-container">
      <div class="error-icon">⚠️</div>
      <h3>{{ error }}</h3>
      <button @click="loadProjectData" class="retry-button">Попробовать снова</button>
    </div>

    <div v-else-if="project" class="project-content">
      <!-- Заголовок и мета-информация -->
      <div class="project-header">
        <div class="title-section">
          <h1>{{ project.title }}</h1>
          <div class="project-meta">
            <span class="meta-item">
              <span class="meta-icon">👤</span>
              {{ project.authorName }}
            </span>
            <span class="meta-item">
              <span class="meta-icon">📁</span>
              {{ project.type }}
            </span>
            <span class="meta-item">
              <span class="meta-icon">📅</span>
              {{ new Date(project.date).toLocaleDateString() }}
            </span>
          </div>
        </div>
        <div class="project-actions">
          <button @click="toggleLike" :class="['action-btn', 'like-btn', { liked: userLike }]">
            <span class="btn-icon">{{ userLike ? '❤️' : '🤍' }}</span>
            <span class="btn-text">{{ project.likes || 0 }}</span>
          </button>
          <button @click="toggleCart" :class="['action-btn', 'cart-btn', { 'in-cart': userInCart }]">
            <span class="btn-icon">{{ userInCart ? '🗑️' : '🛒' }}</span>
            <span class="btn-text">{{ userInCart ? 'В корзине' : 'В корзину' }}</span>
          </button>
        </div>
      </div>

      <!-- Основной контент -->
      <div class="project-main">
        <!-- Левая колонка -->
        <div class="project-left">
          <!-- Изображения -->
          <div v-if="project.images && project.images.length" class="project-images">
            <div class="main-image">
              <img :src="project.images[0]" :alt="project.title">
            </div>
            <div v-if="project.images.length > 1" class="image-thumbnails">
              <div v-for="(image, index) in project.images.slice(0, 4)" :key="index" class="thumbnail"
                :class="{ active: index === 0 }">
                <img :src="image" :alt="`${project.title} - изображение ${index + 1}`">
              </div>
              <div v-if="project.images.length > 4" class="thumbnail more-count">
                +{{ project.images.length - 4 }}
              </div>
            </div>
          </div>

          <!-- Описание -->
          <div class="project-description">
            <h3>Описание проекта</h3>
            <p>{{ project.description }}</p>
          </div>
        </div>

        <!-- Правая колонка -->
        <div class="project-right">
          <!-- Рейтинг -->
          <div class="rating-card">
            <h3>Оценка проекта</h3>
            <div class="rating-display">
              <div class="rating-score">
                <span class="score">{{ averageRating }}</span>
                <span class="max-score">/5</span>
              </div>
              <div class="stars">
                <span v-for="star in 5" :key="star" class="star">
                  {{ star <= starRating ? '⭐' : '☆' }} </span>
              </div>
              <span class="rating-count">На основе {{ project.ratingCount || 0 }} оценок</span>
            </div>

            <div v-if="isAuthenticated" class="rating-input">
              <p class="input-label">Ваша оценка:</p>
              <div class="star-rating">
                <button v-for="rating in 5" :key="rating" @click="rateProject(rating)"
                  :class="['star-btn', { active: rating <= userRating, disabled: userRating > 0 }]"
                  :disabled="userRating > 0">
                  {{ rating <= userRating ? '⭐' : '☆' }} </button>
              </div>
              <div v-if="userRating > 0" class="rating-info">
                <span class="success-icon">✅</span>
                <small>Спасибо за вашу оценку!</small>
              </div>
            </div>
            <div v-else class="auth-prompt">
              <p><router-link to="/auth">Войдите</router-link> чтобы оценить проект</p>
            </div>
          </div>

          <!-- Статистика -->
          <div class="stats-card">
            <h3>Статистика</h3>
            <div class="stats-grid">
              <div class="stat">
                <div class="stat-icon">👁️</div>
                <div class="stat-info">
                  <div class="stat-value">{{ project.views || 0 }}</div>
                  <div class="stat-label">просмотров</div>
                </div>
              </div>
              <div class="stat">
                <div class="stat-icon">❤️</div>
                <div class="stat-info">
                  <div class="stat-value">{{ project.likes || 0 }}</div>
                  <div class="stat-label">лайков</div>
                </div>
              </div>
              <div class="stat">
                <div class="stat-icon">💬</div>
                <div class="stat-info">
                  <div class="stat-value">{{ comments.length }}</div>
                  <div class="stat-label">комментариев</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Комментарии -->
      <div class="comments-section">
        <div class="comments-header">
          <h3>Комментарии <span class="comments-count">({{ comments.length }})</span></h3>
          <button v-if="isAuthenticated && !newComment" @click="newComment = ' '" class="add-comment-btn">
            💬 Добавить комментарий
          </button>
        </div>

        <!-- Форма добавления комментария -->
        <div v-if="isAuthenticated && newComment !== ''" class="comment-form-card">
          <h4>Ваш комментарий</h4>
          <textarea v-model="newComment" placeholder="Поделитесь вашим мнением о проекте..." rows="4"
            class="comment-input" ref="commentInput"></textarea>
          <div class="comment-actions">
            <button @click="newComment = ''" class="cancel-btn">Отмена</button>
            <button @click="addComment" :disabled="!newComment.trim()"
              :class="['submit-btn', { disabled: !newComment.trim() }]">
              Опубликовать
            </button>
          </div>
        </div>
        <div v-else-if="!isAuthenticated" class="auth-prompt-card">
          <p><router-link to="/auth">Войдите</router-link> чтобы оставить комментарий</p>
        </div>

        <!-- Список комментариев -->
        <div v-if="comments.length" class="comments-list">
          <div v-for="comment in comments" :key="comment.id" class="comment-card">
            <div class="comment-header">
              <img src="../../../public/logo.png" class="comment-avatar">
              <div class="comment-user">
                <strong>{{ comment.userName }}</strong>
                <span class="comment-date">
                  {{ formatCommentDate(comment.createdAt) }}
                </span>
              </div>
              <button @click="toggleCommentLike(comment)"
                :class="['comment-like', { liked: isCommentLiked(comment.id) }]">
                <span class="like-icon">{{ isCommentLiked(comment.id) ? '❤️' : '🤍' }}</span>
                <span class="like-count">{{ comment.likes || 0 }}</span>
              </button>
            </div>
            <p class="comment-text">{{ comment.text }}</p>
          </div>
        </div>
        <div v-else class="no-comments">
          <div class="no-comments-icon">💬</div>
          <h4>Пока нет комментариев</h4>
          <p>Будьте первым, кто оставит отзыв об этом проекте!</p>
        </div>
      </div>
    </div>
  </div>
  <Footer />
</template>
<style scoped>
@import "./projectDetails.scss";
</style>