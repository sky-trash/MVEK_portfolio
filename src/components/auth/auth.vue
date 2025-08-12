<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/firebase'; // Импортируем auth из вашего файла

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
    
    // Перенаправление после успешной авторизации
    router.push('/profile');
    
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
    default:
      errorMessage.value = 'Ошибка авторизации. Попробуйте снова.';
      console.error('Unknown auth error:', error);
  }
};

// Проверка авторизации при загрузке страницы
onMounted(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (user) {
      router.push('/profile');
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