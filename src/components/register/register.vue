<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '@/firebase';

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

// Состояние загрузки и ошибок
const isLoading = ref(false);
const isDataLoading = ref(true);
const errorMessage = ref('');

// Списки для выбора
const groups = ref<string[]>([]);
const specialties = ref<string[]>([]);

// Загрузка групп и специальностей из Firebase
const loadGroupsAndSpecialties = async () => {
  try {
    // Загрузка групп
    const groupsQuery = query(collection(db, 'groups'));
    const groupsSnapshot = await getDocs(groupsQuery);

    // Сортируем группы
    groups.value = groupsSnapshot.docs
      .map(doc => doc.data().name)
      .sort((a, b) => {
        const getGroupPrefix = (groupName: string) => groupName.match(/^([А-Я]+)/)?.[0] || '';
        const getGroupNumber = (groupName: string) => groupName.match(/(\d+\.\d+)$/)?.[0] || '0.0';

        const prefixA = getGroupPrefix(a);
        const prefixB = getGroupPrefix(b);
        if (prefixA !== prefixB) return prefixA.localeCompare(prefixB);
        
        return getGroupNumber(a).localeCompare(getGroupNumber(b), undefined, { numeric: true });
      });

    // Загрузка специальностей
    const specialtiesQuery = query(collection(db, 'specialties'));
    const specialtiesSnapshot = await getDocs(specialtiesQuery);
    specialties.value = specialtiesSnapshot.docs.map(doc => doc.data().name);
  } catch (error) {
    console.error('Ошибка загрузки данных:', error);
    errorMessage.value = 'Не удалось загрузить список групп и специальностей';
  } finally {
    isDataLoading.value = false;
  }
};

// Проверка уникальности имени пользователя
const checkLogin = async (login: string) => {
  const q = query(collection(db, 'users'), where('login', '==', login));
  const querySnapshot = await getDocs(q);
  return querySnapshot.empty;
};

const handleRegister = async () => {
  if (!validateForm()) return;

  isLoading.value = true;
  errorMessage.value = '';

  try {
    // 1. Проверка логина
    const loginAvailable = await checkLogin(formData.value.login);
    if (!loginAvailable) throw new Error('Это имя пользователя уже занято');

    // 2. Создание пользователя
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      formData.value.email,
      formData.value.password
    );

    // 3. Сохранение данных пользователя
    const userData = {
      userId: userCredential.user.uid,
      login: formData.value.login,
      email: formData.value.email,
      group: formData.value.group,
      specialty: formData.value.specialty,
      avatarUrl: '', // Пустая строка вместо аватара
      role: 'student',
      name: formData.value.name,
      surname: formData.value.surname,
      lname: formData.value.lname,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await addDoc(collection(db, 'users'), userData);

    // 4. Отправка подтверждения
    await sendEmailVerification(userCredential.user);

    // 5. Успешное завершение
    router.push('/profile');

  } catch (error) {
    console.error('Ошибка регистрации:', error);
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

  if (!formData.value.group || !formData.value.specialty) {
    errorMessage.value = 'Выберите группу и специальность';
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

// Переход к авторизации
const goToLogin = () => {
  router.push('/auth');
};

// Загружаем данные при монтировании компонента
onMounted(() => {
  loadGroupsAndSpecialties();
});
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
              <input v-model="formData.name" type="text" id="name" class="form-input" placeholder="Введите ваше имя"
                required />
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
              <label for="group" class="form-label">Группа*</label>
              <select v-model="formData.group" id="group" class="form-input" :disabled="isDataLoading" required>
                <option value="" disabled selected>
                  {{ isDataLoading ? 'Загрузка...' : 'Выберите группу' }}
                </option>
                <option v-for="group in groups" :key="group" :value="group">
                  {{ group }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label for="specialty" class="form-label">Специальность*</label>
              <select v-model="formData.specialty" id="specialty" class="form-input" :disabled="isDataLoading" required>
                <option value="" disabled selected>
                  {{ isDataLoading ? 'Загрузка...' : 'Выберите специальность' }}
                </option>
                <option v-for="specialty in specialties" :key="specialty" :value="specialty">
                  {{ specialty }}
                </option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label for="lname" class="form-label">Отчество</label>
            <input v-model="formData.lname" type="text" id="lname" class="form-input"
              placeholder="Введите ваше отчество" />
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