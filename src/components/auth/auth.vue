<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

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
    // Здесь будет запрос к API
    console.log('Авторизация:', formData.value);
    
    // Имитация задержки сети
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Перенаправление после успешной авторизации
    router.push('/profile');
  } catch (error) {
    errorMessage.value = 'Ошибка авторизации. Проверьте данные и попробуйте снова.';
    console.error('Auth error:', error);
  } finally {
    isLoading.value = false;
  }
};

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