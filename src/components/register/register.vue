<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// Данные формы
const formData = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  group: '',
  specialty: '',
  agreeTerms: false
});

// Состояние загрузки и ошибок
const isLoading = ref(false);
const errorMessage = ref('');

// Список групп и специальностей (можно заменить на API-запрос)
const groups = ref(['ДИ-21', 'ДИ-22', 'ДИ-23', 'ДИ-24']);
const specialties = ref(['Графический дизайн', 'Веб-дизайн', 'Промышленный дизайн', 'Дизайн интерьера']);

// Функция регистрации
const handleRegister = async () => {
  if (!validateForm()) return;

  isLoading.value = true;
  errorMessage.value = '';

  try {
    // Здесь будет запрос к API
    console.log('Регистрация:', formData.value);
    
    // Имитация задержки сети
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Перенаправление после успешной регистрации
    router.push('/profile');
  } catch (error) {
    errorMessage.value = 'Ошибка регистрации. Пожалуйста, попробуйте позже.';
    console.error('Registration error:', error);
  } finally {
    isLoading.value = false;
  }
};

// Валидация формы
const validateForm = () => {
  if (!formData.value.username || !formData.value.email || !formData.value.password || !formData.value.confirmPassword) {
    errorMessage.value = 'Заполните все обязательные поля';
    return false;
  }

  if (formData.value.password !== formData.value.confirmPassword) {
    errorMessage.value = 'Пароли не совпадают';
    return false;
  }

  if (!formData.value.agreeTerms) {
    errorMessage.value = 'Необходимо согласиться с условиями';
    return false;
  }

  return true;
};

// Переход к авторизации
const goToLogin = () => {
  router.push('/auth');
};
</script>

<template>
  <main class="auth-page">
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <h1 class="auth-title">Регистрация</h1>
          <p class="auth-subtitle">Создайте аккаунт для доступа к портфолио</p>
        </div>

        <form @submit.prevent="handleRegister" class="auth-form">
          <div class="form-group">
            <label for="username" class="form-label">Имя пользователя*</label>
            <input
              v-model="formData.username"
              type="text"
              id="username"
              class="form-input"
              placeholder="Придумайте никнейм"
              required
            />
          </div>

          <div class="form-group">
            <label for="email" class="form-label">Email*</label>
            <input
              v-model="formData.email"
              type="email"
              id="email"
              class="form-input"
              placeholder="Ваш email"
              required
            />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="password" class="form-label">Пароль*</label>
              <input
                v-model="formData.password"
                type="password"
                id="password"
                class="form-input"
                placeholder="Не менее 6 символов"
                required
              />
            </div>

            <div class="form-group">
              <label for="confirmPassword" class="form-label">Подтвердите пароль*</label>
              <input
                v-model="formData.confirmPassword"
                type="password"
                id="confirmPassword"
                class="form-input"
                placeholder="Повторите пароль"
                required
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="group" class="form-label">Группа</label>
              <select
                v-model="formData.group"
                id="group"
                class="form-input"
              >
                <option value="" disabled selected>Выберите группу</option>
                <option v-for="group in groups" :key="group" :value="group">
                  {{ group }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label for="specialty" class="form-label">Специальность</label>
              <select
                v-model="formData.specialty"
                id="specialty"
                class="form-input"
              >
                <option value="" disabled selected>Выберите специальность</option>
                <option v-for="specialty in specialties" :key="specialty" :value="specialty">
                  {{ specialty }}
                </option>
              </select>
            </div>
          </div>

          <div class="form-options">
            <label class="checkbox-label">
              <input
                v-model="formData.agreeTerms"
                type="checkbox"
                class="checkbox-input"
                required
              />
              <span class="checkbox-custom"></span>
              Я согласен с <router-link to="/terms" class="terms-link">условиями использования</router-link>
            </label>
          </div>

          <div v-if="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>

          <button type="submit" class="auth-button" :disabled="isLoading">
            <span v-if="!isLoading">Зарегистрироваться</span>
            <span v-else class="loading-spinner"></span>
          </button>
        </form>

        <div class="auth-footer">
          <p class="auth-footer-text">
            Уже есть аккаунт?
            <button @click="goToLogin" class="auth-footer-link">
              Войти
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
@import "./register.scss";
</style>