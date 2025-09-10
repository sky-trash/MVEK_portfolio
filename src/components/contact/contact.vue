<script setup lang="ts">
import Header from '../layouts/header/header.vue';
import Footer from '../layouts/footer/footer.vue';
import { ref } from 'vue';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase';

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
    // Сохраняем данные в Firestore
    await addDoc(collection(db, 'contacts'), {
      name: formData.value.name.trim(),
      email: formData.value.email.trim(),
      subject: formData.value.subject,
      message: formData.value.message.trim(),
      status: 'new', // новый статус обращения
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    isSubmitted.value = true;
    formData.value = { name: '', email: '', message: '', subject: 'Общий вопрос' };

  } catch (error) {
    console.error('Ошибка при сохранении формы:', error);
    errorMessage.value = 'Ошибка при отправке формы. Попробуйте позже.';
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <Header />
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
              <i class="fas fa-map-marker-alt">📍</i>
            </div>
            <div>
              <h3>Адрес</h3>
              <p>г. Ижевск, ул. Пушкинская, д. 268Ж</p>
            </div>
          </div>

          <div class="contact-method">
            <div class="icon-wrapper">
              <i class="fas fa-phone-alt">📞</i>
            </div>
            <div>
              <h3>Телефон</h3>
              <p>+7 (3412) 91-81-18</p>
            </div>
          </div>

          <div class="contact-method">
            <div class="icon-wrapper">
              <i class="fas fa-envelope">📧</i>
            </div>
            <div>
              <h3>Email</h3>
              <p>pk@mveu.ru</p>
            </div>
          </div>

          <div class="contact-method">
            <div class="icon-wrapper">
              <i class="fas fa-clock">🕐</i>
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
              <a href="https://vk.com/mveu_ru" class="social-icon" aria-label="ВКонтакте">
                <!-- <i class="icon-vk"></i> -->
                <svg class="vk-icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path
                    d="M13.162 18.994c.609 0 .858-.406.851-.915-.031-1.917.714-2.949 2.059-1.604 1.488 1.488 1.796 2.519 3.603 2.519h3.2c.808 0 1.126-.26 1.126-.668 0-.863-1.421-2.386-2.625-3.504-1.686-1.565-1.765-1.602-.313-3.486 1.801-2.339 4.157-5.336 2.073-5.336h-3.981c-.772 0-.828.435-1.103 1.083-.995 2.347-2.886 5.387-3.604 4.922-.751-.485-.407-2.406-.35-5.261.015-.754.011-1.271-1.141-1.539-.629-.145-1.241-.205-1.809-.205-2.273 0-3.841.953-2.95 1.119 1.571.293 1.42 3.692 1.054 5.16-.638 2.556-3.036-2.024-4.035-4.305-.241-.548-.315-.974-1.175-.974h-3.255c-.492 0-.787.16-.787.516 0 .602 2.96 6.72 5.786 9.77 2.756 2.975 5.48 2.708 7.376 2.708z" />
                </svg>
              </a>
              <a href="https://vk.com/kkizh_ru" class="social-icon" aria-label="ВКонтакте">
                <!-- <i class="icon-vk"></i> -->
                <svg class="vk-icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path
                    d="M13.162 18.994c.609 0 .858-.406.851-.915-.031-1.917.714-2.949 2.059-1.604 1.488 1.488 1.796 2.519 3.603 2.519h3.2c.808 0 1.126-.26 1.126-.668 0-.863-1.421-2.386-2.625-3.504-1.686-1.565-1.765-1.602-.313-3.486 1.801-2.339 4.157-5.336 2.073-5.336h-3.981c-.772 0-.828.435-1.103 1.083-.995 2.347-2.886 5.387-3.604 4.922-.751-.485-.407-2.406-.35-5.261.015-.754.011-1.271-1.141-1.539-.629-.145-1.241-.205-1.809-.205-2.273 0-3.841.953-2.95 1.119 1.571.293 1.42 3.692 1.054 5.16-.638 2.556-3.036-2.024-4.035-4.305-.241-.548-.315-.974-1.175-.974h-3.255c-.492 0-.787.16-.787.516 0 .602 2.96 6.72 5.786 9.77 2.756 2.975 5.48 2.708 7.376 2.708z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div class="map-section">
          <h2><i class="fas fa-map-marked-alt"></i> Как нас найти</h2>
          <div class="map-container">
            <iframe src="https://yandex.ru/map-widget/v1/?um=constructor%3A1a2b3c4d5e6f7g8h9i0j&amp;source=constructor"
              frameborder="0" class="map-iframe" aria-label="Карта расположения"></iframe>
          </div>
        </div>

        <div class="contact-form-section">
          <h2><i class="fas fa-paper-plane"></i> Форма обратной связи</h2>

          <div v-if="isSubmitted" class="success-message">
            <i class="fas fa-check-circle"></i>
            <p>Спасибо! Ваше сообщение отправлено. Мы свяжемся с вами в ближайшее время.</p>
            <button @click="isSubmitted = false" class="new-message-btn">
              Написать ещё
            </button>
          </div>

          <form v-else @submit.prevent="handleSubmit" class="feedback-form">
            <div class="form-group">
              <label for="name">Ваше имя*</label>
              <input v-model="formData.name" type="text" id="name" placeholder="Иванов Иван" required>
            </div>

            <div class="form-group">
              <label for="email">Email*</label>
              <input v-model="formData.email" type="email" id="email" placeholder="example@mail.ru" required>
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
              <textarea v-model="formData.message" id="message" rows="5" placeholder="Ваше сообщение..."
                required></textarea>
            </div>

            <div v-if="errorMessage" class="error-message">
              <i class="fas fa-exclamation-circle"></i>
              {{ errorMessage }}
            </div>

            <button type="submit" :disabled="isLoading" class="submit-btn">
              <span v-if="!isLoading">Отправить сообщение</span>
              <span v-else class="loading-spinner">Отправка...</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  </main>
  <Footer />
</template>

<style scoped>
/* Стили для формы */
.feedback-form {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #2d3748;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #4a6cf7;
}

.form-group textarea {
  resize: vertical;
  min-height: 120px;
  font-family: inherit;
}

.submit-btn {
  width: 100%;
  background: linear-gradient(135deg, #4a6cf7 0%, #667eea 100%);
  color: white;
  border: none;
  padding: 1rem;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(74, 108, 247, 0.4);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.loading-spinner {
  display: inline-block;
}

.success-message {
  background: #f0f9f0;
  border: 1px solid #48bb78;
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
  color: #2f855a;
}

.success-message i {
  font-size: 2rem;
  margin-bottom: 1rem;
  display: block;
}

.new-message-btn {
  background: #48bb78;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  margin-top: 1rem;
  cursor: pointer;
  transition: background 0.3s ease;
}

.new-message-btn:hover {
  background: #38a169;
}

.error-message {
  background: #fef2f2;
  border: 1px solid #feb2b2;
  color: #c53030;
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Адаптивность */
@media (max-width: 768px) {
  .contacts-content {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .feedback-form {
    padding: 1.5rem;
  }
}
</style>
<style scoped>
@import "./contact.scss";
</style>