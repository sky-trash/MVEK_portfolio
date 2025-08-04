<script setup lang="ts">
import Header from '../layouts/header/header.vue';
import Footer from '../layouts/footer/footer.vue';
import { ref } from 'vue';

const formData = ref({
  name: '',
  email: '',
  message: '',
  subject: 'Общий вопрос'
});

const isLoading = ref(false);
const isSubmitted = ref(false);
const errorMessage = ref('');

const subjects = ref([
  'Общий вопрос',
  'Техническая поддержка',
  'Сотрудничество',
  'Предложения по улучшению',
  'Другое'
]);

const handleSubmit = async () => {
  // Валидация формы
  if (!formData.value.name.trim()) {
    errorMessage.value = 'Введите ваше имя';
    return;
  }

  if (!formData.value.email.includes('@')) {
    errorMessage.value = 'Введите корректный email';
    return;
  }

  if (!formData.value.message.trim()) {
    errorMessage.value = 'Введите ваше сообщение';
    return;
  }

  isLoading.value = true;
  errorMessage.value = '';

  try {
    // Имитация отправки данных
    await new Promise(resolve => setTimeout(resolve, 1500));
    isSubmitted.value = true;
    formData.value = { name: '', email: '', message: '', subject: 'Общий вопрос' };
  } catch (error) {
    errorMessage.value = 'Ошибка при отправке формы. Попробуйте позже.';
    console.error('Form error:', error);
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <Header/>
  <main class="contacts-page">
    <div class="container">
      <section class="page-header">
        <h1>Контакты</h1>
        <p>Свяжитесь с нами для получения дополнительной информации</p>
      </section>

      <div class="contacts-content">
        <div class="contact-info-section">
          <h2><i class="fas fa-info-circle"></i> Контактная информация</h2>
          
          <div class="contact-method">
            <div class="icon-wrapper">
              <i class="fas fa-map-marker-alt"></i>
            </div>
            <div>
              <h3>Адрес</h3>
              <p>г. Москва, ул. Дизайнерская, д. 15, корп. 2</p>
            </div>
          </div>

          <div class="contact-method">
            <div class="icon-wrapper">
              <i class="fas fa-phone-alt"></i>
            </div>
            <div>
              <h3>Телефон</h3>
              <p>+7 (495) 123-45-67</p>
            </div>
          </div>

          <div class="contact-method">
            <div class="icon-wrapper">
              <i class="fas fa-envelope"></i>
            </div>
            <div>
              <h3>Email</h3>
              <p>info@mvek-portfolio.ru</p>
            </div>
          </div>

          <div class="contact-method">
            <div class="icon-wrapper">
              <i class="fas fa-clock"></i>
            </div>
            <div>
              <h3>Часы работы</h3>
              <p>Пн-Пт: 9:00 - 18:00</p>
              <p>Сб-Вс: выходной</p>
            </div>
          </div>

          <div class="social-media">
            <h3>Мы в соцсетях</h3>
            <div class="social-icons">
              <a href="#" aria-label="ВКонтакте"><i class="fab fa-vk"></i></a>
              <a href="#" aria-label="Telegram"><i class="fab fa-telegram"></i></a>
              <a href="#" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
            </div>
          </div>
        </div>

        <div class="map-section">
          <h2><i class="fas fa-map-marked-alt"></i> Как нас найти</h2>
          <div class="map-container">
            <!-- Здесь будет встроенная карта -->
            <iframe 
              src="https://yandex.ru/map-widget/v1/?um=constructor%3A1a2b3c4d5e6f7g8h9i0j&amp;source=constructor"
              frameborder="0"
              class="map-iframe"
              aria-label="Карта расположения"
            ></iframe>
          </div>
        </div>

        <div class="contact-form-section">
          <h2><i class="fas fa-paper-plane"></i> Форма обратной связи</h2>
          
          <div v-if="isSubmitted" class="success-message">
            <i class="fas fa-check-circle"></i>
            <p>Спасибо! Ваше сообщение отправлено.</p>
            <button @click="isSubmitted = false" class="new-message-btn">
              Написать ещё
            </button>
          </div>

          <form v-else @submit.prevent="handleSubmit" class="feedback-form">
            <div class="form-group">
              <label for="name">Ваше имя*</label>
              <input
                v-model="formData.name"
                type="text"
                id="name"
                placeholder="Иванов Иван"
                required
              >
            </div>

            <div class="form-group">
              <label for="email">Email*</label>
              <input
                v-model="formData.email"
                type="email"
                id="email"
                placeholder="example@mail.ru"
                required
              >
            </div>

            <div class="form-group">
              <label for="subject">Тема обращения</label>
              <select v-model="formData.subject" id="subject">
                <option v-for="(subject, index) in subjects" :key="index" :value="subject">
                  {{ subject }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label for="message">Сообщение*</label>
              <textarea
                v-model="formData.message"
                id="message"
                rows="5"
                placeholder="Ваше сообщение..."
                required
              ></textarea>
            </div>

            <div v-if="errorMessage" class="error-message">
              <i class="fas fa-exclamation-circle"></i>
              {{ errorMessage }}
            </div>

            <button type="submit" :disabled="isLoading" class="submit-btn">
              <span v-if="!isLoading">Отправить</span>
              <span v-else class="loading-spinner"></span>
            </button>
          </form>
        </div>
      </div>
    </div>
  </main>
  <Footer/>
</template>
<style scoped>
@import "./contact.scss";
</style>