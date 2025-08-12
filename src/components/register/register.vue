<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '@/firebase';

const router = useRouter();

// Данные формы
const formData = ref({
  login: '',
  email: '',
  password: '',
  confirmPassword: '',
  group: '',
  specialty: '',
  name: '',
  surname: '',
  lname: '',
  agreeTerms: false
});

const avatarFile = ref<File | null>(null);

// Состояние загрузки и ошибок
const isLoading = ref(false);
const errorMessage = ref('');

// Списки для выбора
const groups = ref(['ДИ-21', 'ДИ-22', 'ДИ-23', 'ДИ-24']);
const specialties = ref(['Графический дизайн', 'Веб-дизайн', 'Промышленный дизайн', 'Дизайн интерьера']);

// Проверка уникальности имени пользователя
const checkLogin = async (login: string) => {
  const q = query(collection(db, 'users'), where('login', '==', login));
  const querySnapshot = await getDocs(q);
  return querySnapshot.empty;
};

// Загрузка аватара
const handleAvatarUpload = async (userId: string, file: File) => {
  const ref = storageRef(storage, `avatars/${userId}`);
  await uploadBytes(ref, file);
  return await getDownloadURL(ref);
};

// Функция регистрации
const handleRegister = async () => {
  if (!validateForm()) return;

  isLoading.value = true;
  errorMessage.value = '';

  try {
    // Проверка уникальности имени пользователя
    const isLoginAvailable = await checkLogin(formData.value.login);
    if (!isLoginAvailable) {
      throw new Error('Это имя пользователя уже занято');
    }

    // Создаем пользователя в Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      formData.value.email,
      formData.value.password
    );

    // Загружаем аватар, если он есть
    let avatarUrl = '';
    if (avatarFile.value) {
      avatarUrl = await handleAvatarUpload(userCredential.user.uid, avatarFile.value);
    }

    // Сохраняем дополнительные данные пользователя в Firestore
    await addDoc(collection(db, 'users'), {
      userId: userCredential.user.uid,
      login: formData.value.login,
      email: formData.value.email,
      group: formData.value.group,
      specialty: formData.value.specialty,
      avatarUrl: avatarUrl,
      role: 'student', // По умолчанию все новые пользователи - студенты
      name: formData.value.name,
      surname: formData.value.surname,
      lname: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Отправляем email для подтверждения
    await sendEmailVerification(userCredential.user);

    // Перенаправление после успешной регистрации
    router.push('/profile');
  } catch (error: any) {
    console.error('Registration error:', error);
    handleFirebaseError(error);
  } finally {
    isLoading.value = false;
  }
};

// Валидация формы
const validateForm = () => {
  if (!formData.value.login || !formData.value.email ||
    !formData.value.password || !formData.value.confirmPassword) {
    errorMessage.value = 'Заполните все поля';
    return false;
  }

  if (formData.value.password.length < 6) {
    errorMessage.value = 'Пароль должен содержать не менее 6 символов';
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

// Обработка ошибок Firebase
const handleFirebaseError = (error: any) => {
  switch (error.code) {
    case 'auth/email-already-in-use':
      errorMessage.value = 'Этот email уже используется';
      break;
    case 'auth/invalid-email':
      errorMessage.value = 'Некорректный email';
      break;
    case 'auth/weak-password':
      errorMessage.value = 'Пароль должен содержать не менее 6 символов';
      break;
    case 'auth/operation-not-allowed':
      errorMessage.value = 'Регистрация с email/password отключена';
      break;
    case 'auth/configuration-not-found':
      errorMessage.value = 'Ошибка конфигурации Firebase. Пожалуйста, свяжитесь с администратором.';
      break;
    default:
      errorMessage.value = error.message || 'Ошибка регистрации. Пожалуйста, попробуйте позже.';
  }
};

// Обработка загрузки аватара
const handleAvatarChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    avatarFile.value = target.files[0];
  }
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
            <label for="login" class="form-label">Логин*</label>
            <input v-model="formData.login" type="text" id="login" class="form-input" placeholder="Придумайте логин"
              required />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="name" class="form-label">Имя*</label>
              <input v-model="formData.name" type="text" id="name" class="form-input"
                placeholder="Введите ваше имя" required />
            </div>

            <div class="form-group">
              <label for="surname" class="form-label">Фамилия*</label>
              <input v-model="formData.surname" type="text" id="surname" class="form-input"
                placeholder="Введите вашу фамилию" required />
            </div>
          </div>

          <div class="form-group">
            <label for="email" class="form-label">Email*</label>
            <input v-model="formData.email" type="email" id="email" class="form-input" placeholder="Ваш email"
              required />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="password" class="form-label">Пароль*</label>
              <input v-model="formData.password" type="password" id="password" class="form-input"
                placeholder="Не менее 6 символов" required />
            </div>

            <div class="form-group">
              <label for="confirmPassword" class="form-label">Подтвердите пароль*</label>
              <input v-model="formData.confirmPassword" type="password" id="confirmPassword" class="form-input"
                placeholder="Повторите пароль" required />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="group" class="form-label">Группа</label>
              <select v-model="formData.group" id="group" class="form-input">
                <option value="" disabled selected>Выберите группу</option>
                <option v-for="group in groups" :key="group" :value="group">
                  {{ group }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label for="specialty" class="form-label">Специальность</label>
              <select v-model="formData.specialty" id="specialty" class="form-input">
                <option value="" disabled selected>Выберите специальность</option>
                <option v-for="specialty in specialties" :key="specialty" :value="specialty">
                  {{ specialty }}
                </option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label for="avatar" class="form-label">Аватар</label>
            <input type="file" id="avatar" accept="image/*" @change="handleAvatarChange" class="form-input" />
          </div>

          <div class="form-options">
            <label class="checkbox-label">
              <input v-model="formData.agreeTerms" type="checkbox" class="checkbox-input" required />
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