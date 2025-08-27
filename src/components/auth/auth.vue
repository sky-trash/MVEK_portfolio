<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '@/firebase'; // Добавляем импорт db

const router = useRouter();

// Данные формы
const formData = ref({
  email: '',
  password: '',
  remember: false
});

// Состояние загрузки
const isLoading = ref(false);
const errorMessage = ref('');

// Функция для получения роли пользователя из Firestore
const getUserRole = async (userId: string) => {
  try {
    const q = query(collection(db, 'users'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const userData = querySnapshot.docs[0].data();
      return userData.role || 'student'; // По умолчанию student
    }
    
    return 'student'; // Роль по умолчанию, если не найдена
  } catch (error) {
    console.error('Error getting user role:', error);
    return 'student';
  }
};

// Функция авторизации
const handleLogin = async () => {
  if (!formData.value.email || !formData.value.password) {
    errorMessage.value = 'Заполните все поля';
    return;
  }

  isLoading.value = true;
  errorMessage.value = '';

  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      formData.value.email,
      formData.value.password
    );
    
    const token = await userCredential.user.getIdToken();
    
    // Сохраняем токен и email
    const storage = formData.value.remember ? localStorage : sessionStorage;
    storage.setItem('authToken', token);
    storage.setItem('userEmail', formData.value.email);
    storage.setItem('userId', userCredential.user.uid);
    
    // Получаем роль пользователя
    const userRole = await getUserRole(userCredential.user.uid);
    storage.setItem('userRole', userRole);
    
    // Перенаправление в зависимости от роли
    if (userRole === 'student') {
      router.push('/profile');
    } else if (userRole === 'teacher') {
      router.push('/teacherProfile');
    } else {
      router.push('/profile'); // По умолчанию для студента
    }
    
  } catch (error: any) {
    console.error('Auth error:', error);
    handleAuthError(error);
  } finally {
    isLoading.value = false;
  }
};

// Обработчик ошибок авторизации
const handleAuthError = (error: any) => {
  switch (error.code) {
    case 'auth/invalid-email':
      errorMessage.value = 'Некорректный email';
      break;
    case 'auth/user-disabled':
      errorMessage.value = 'Пользователь заблокирован';
      break;
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      errorMessage.value = 'Неверный email или пароль';
      break;
    case 'auth/too-many-requests':
      errorMessage.value = 'Слишком много попыток. Попробуйте позже.';
      break;
    case 'auth/network-request-failed':
      errorMessage.value = 'Ошибка сети. Проверьте подключение.';
      break;
    case 'auth/configuration-not-found':
      errorMessage.value = 'Ошибка конфигурации. Свяжитесь с администратором.';
      break;
    default:
      errorMessage.value = 'Ошибка авторизации. Попробуйте снова.';
      console.error('Unknown auth error:', error);
  }
};

// Проверка авторизации при загрузке страницы
onMounted(() => {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (user) {
      // Проверяем email verification
      if (!user.emailVerified) {
        await auth.signOut();
        errorMessage.value = 'Пожалуйста, подтвердите вашу электронную почту';
        return;
      }
      
      // Получаем роль и перенаправляем
      const userRole = await getUserRole(user.uid);
      const storage = localStorage.getItem('authToken') ? localStorage : sessionStorage;
      storage.setItem('userRole', userRole);
      
      if (userRole === 'student') {
        router.push('/profile');
      } else if (userRole === 'teacher') {
        router.push('/teacherProfile');
      } else {
        router.push('/profile');
      }
    }
    unsubscribe();
  });
});

// Переход к регистрации
const goToRegister = () => {
  router.push('/register');
};
</script>

<template>
  <main class="auth-page">
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <h1 class="auth-title">Вход в систему</h1>
          <p class="auth-subtitle">Введите ваши данные для входа</p>
        </div>

        <form @submit.prevent="handleLogin" class="auth-form">
          <div class="form-group">
            <label for="email" class="form-label">Email</label>
            <input
              v-model="formData.email"
              type="email"
              id="email"
              class="form-input"
              placeholder="Ваш email"
              required
            />
          </div>

          <div class="form-group">
            <label for="password" class="form-label">Пароль</label>
            <input
              v-model="formData.password"
              type="password"
              id="password"
              class="form-input"
              placeholder="Ваш пароль"
              required
            />
          </div>

          <div class="form-options">
            <label class="checkbox-label">
              <input
                v-model="formData.remember"
                type="checkbox"
                class="checkbox-input"
              />
              <span class="checkbox-custom"></span>
              Запомнить меня
            </label>
            <router-link to="/forgot-password" class="forgot-password">
              Забыли пароль?
            </router-link>
          </div>

          <div v-if="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>

          <button type="submit" class="auth-button" :disabled="isLoading">
            <span v-if="!isLoading">Войти</span>
            <span v-else class="loading-spinner"></span>
          </button>
        </form>

        <div class="auth-footer">
          <p class="auth-footer-text">
            Ещё нет аккаунта?
            <button @click="goToRegister" class="auth-footer-link">
              Зарегистрироваться
            </button>
          </p>
        </div>
      </div>

      <div class="auth-hero">
        <div class="hero-content">
          <h2 class="hero-title">Портфолио МВЕК</h2>
          <p class="hero-description">
            Платформа для демонстрации достижений студентов-дизайнеров
          </p>
        </div>
      </div>
    </div>
  </main>
</template>
<style scoped>
@import "./auth.scss";
</style>