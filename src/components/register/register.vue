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
  agreeTerms: false,
  role: 'student'
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

    // 3. Подготовка данных пользователя
    const userData: any = {
      userId: userCredential.user.uid,
      login: formData.value.login,
      email: formData.value.email,
      avatarUrl: '',
      role: formData.value.role,
      name: formData.value.name,
      surname: formData.value.surname,
      lname: formData.value.lname,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Добавляем поля в зависимости от роли
    if (formData.value.role === 'student') {
      userData.group = formData.value.group;
      userData.specialty = formData.value.specialty;
    }

    // 4. Сохранение данных пользователя
    await addDoc(collection(db, 'users'), userData);
    
    // 5. Отправка подтверждения
    await sendEmailVerification(userCredential.user);

    // 6. Перенаправление в зависимости от роли
    if (formData.value.role === 'student') {
      router.push('/profile');
    } else {
      router.push('/teacherProfile');
    }

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

  // Для студентов проверяем группу и специальность
  if (formData.value.role === 'student') {
    if (!formData.value.group || !formData.value.specialty) {
      errorMessage.value = 'Выберите группу и специальность';
      return false;
    }
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
          <!-- Выбор роли -->
          <div class="form-group">
            <label class="form-label">Регистрируюсь как*</label>
            <div class="role-selector">
              <label class="role-option">
                <input 
                  type="radio" 
                  v-model="formData.role" 
                  value="student" 
                  class="role-input"
                />
                <span class="role-label">Студент</span>
              </label>
              <label class="role-option">
                <input 
                  type="radio" 
                  v-model="formData.role" 
                  value="teacher" 
                  class="role-input"
                />
                <span class="role-label">Преподаватель</span>
              </label>
            </div>
          </div>

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

          <!-- Поля только для студентов -->
          <div v-if="formData.role === 'student'" class="form-row">
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

.auth-card {
  flex: 1;
  padding: 40px;
}

.auth-hero {
  flex: 0 0 40%;
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.hero-content {
  text-align: center;
}

.hero-title {
  font-size: 28px;
  margin-bottom: 16px;
  font-weight: 700;
}

.hero-description {
  font-size: 16px;
  opacity: 0.9;
}

.auth-header {
  text-align: center;
  margin-bottom: 32px;
}

.auth-title {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 8px;
}

.auth-subtitle {
  color: #6b7280;
  font-size: 16px;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-label {
  font-weight: 500;
  margin-bottom: 8px;
  color: #374151;
  font-size: 14px;
}

.form-input {
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #4f46e5;
}

.form-input:disabled {
  background-color: #f3f4f6;
  cursor: not-allowed;
}

/* Стили для выбора роли */
.role-selector {
  display: flex;
  gap: 16px;
  margin-top: 8px;
}

.role-option {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  transition: all 0.2s;
}

.role-option:hover {
  border-color: #4f46e5;
}

.role-input {
  margin-right: 8px;
}

.role-input:checked + .role-label {
  color: #4f46e5;
  font-weight: 500;
}

.role-input:checked ~ .role-label {
  color: #4f46e5;
  font-weight: 500;
}

.role-label {
  font-size: 16px;
  color: #374151;
}

/* Чекбокс */
.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 14px;
  color: #6b7280;
}

.checkbox-input {
  margin-right: 8px;
}

.terms-link {
  color: #4f46e5;
  text-decoration: none;
}

.terms-link:hover {
  text-decoration: underline;
}

/* Кнопка */
.auth-button {
  background-color: #4f46e5;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 14px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.auth-button:hover:not(:disabled) {
  background-color: #4338ca;
}

.auth-button:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}

.loading-spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Ошибка */
.error-message {
  background-color: #fee2e2;
  color: #ef4444;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
}

/* Футер */
.auth-footer {
  text-align: center;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
}

.auth-footer-text {
  color: #6b7280;
  font-size: 14px;
}

.auth-footer-link {
  color: #4f46e5;
  background: none;
  border: none;
  cursor: pointer;
  font-weight: 500;
  text-decoration: underline;
}

/* Адаптивность */
@media (max-width: 768px) {
  .auth-container {
    flex-direction: column;
  }
  
  .auth-hero {
    display: none;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .role-selector {
    flex-direction: column;
  }
}
</style>
<style scoped>
@import "./register.scss";
</style>