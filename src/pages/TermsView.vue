<script setup lang="ts">
import Header from '../components/layouts/header/header.vue';
import Footer from '../components/layouts/footer/footer.vue';
import { ref } from 'vue';

const sections = ref([
  {
    id: 'introduction',
    title: '1. Введение',
    content: `
      <p>Добро пожаловать на нашу образовательную платформу. Эти Условия использования регулируют ваше использование нашего веб-сайта и услуг.</p>
      <p>Пожалуйста, внимательно прочитайте эти условия перед использованием наших услуг. Используя наш сайт, вы соглашаетесь соблюдать эти условия.</p>
    `
  },
  {
    id: 'definitions',
    title: '2. Определения',
    content: `
      <ul>
        <li><strong>Платформа</strong> - наш веб-сайт и связанные с ним услуги</li>
        <li><strong>Пользователь</strong> - любое лицо, использующее нашу платформу</li>
        <li><strong>Контент</strong> - любые материалы, размещенные на платформе</li>
        <li><strong>Услуги</strong> - образовательные и сопутствующие услуги, предоставляемые платформой</li>
      </ul>
    `
  },
  {
    id: 'account',
    title: '3. Учетная запись',
    content: `
      <h4>3.1 Регистрация</h4>
      <p>Для доступа к некоторым функциям платформы требуется создание учетной записи. Вы обязаны предоставлять точную и полную информацию при регистрации.</p>
      
      <h4>3.2 Безопасность аккаунта</h4>
      <p>Вы несете ответственность за сохранность ваших учетных данных и за все действия, совершаемые под вашей учетной записью.</p>
      
      <h4>3.3 Возрастные ограничения</h4>
      <p>Для регистрации на платформе вам должно быть не менее 14 лет. Для несовершеннолетних требуется согласие родителей или опекунов.</p>
    `
  },
  {
    id: 'content',
    title: '4. Интеллектуальная собственность',
    content: `
      <h4>4.1 Наш контент</h4>
      <p>Все материалы платформы, включая тексты, графику, логотипы и программное обеспечение, защищены авторским правом.</p>
      
      <h4>4.2 Пользовательский контент</h4>
      <p>Размещая контент на нашей платформе, вы предоставляете нам неисключительную лицензию на его использование в образовательных целях.</p>
      
      <h4>4.3 Ограничения</h4>
      <p>Запрещается копирование, распространение или использование материалов платформы без нашего письменного разрешения.</p>
    `
  },
  {
    id: 'conduct',
    title: '5. Правила поведения',
    content: `
      <p>При использовании платформы вы обязуетесь:</p>
      <ul>
        <li>Соблюдать законы Российской Федерации</li>
        <li>Уважать права других пользователей</li>
        <li>Не размещать незаконный или оскорбительный контент</li>
        <li>Не нарушать работу платформы</li>
        <li>Не пытаться получить несанкционированный доступ к системам</li>
      </ul>
    `
  },
  {
    id: 'privacy',
    title: '6. Конфиденциальность',
    content: `
      <p>Мы серьезно относимся к защите ваших персональных данных. Подробная информация о сборе и использовании данных представлена в нашей <router-link to="/privacy" class="text-link">Политике конфиденциальности</router-link>.</p>
    `
  },
  {
    id: 'limitations',
    title: '7. Ограничение ответственности',
    content: `
      <p>Платформа предоставляется "как есть". Мы не гарантируем бесперебойную работу или полное соответствие вашим ожиданиям.</p>
      <p>Мы не несем ответственности за:</p>
      <ul>
        <li>Любые косвенные убытки</li>
        <li>Действия других пользователей</li>
        <li>Контент, размещенный третьими лицами</li>
        <li>Технические сбои вне нашего контроля</li>
      </ul>
    `
  },
  {
    id: 'changes',
    title: '8. Изменения условий',
    content: `
      <p>Мы оставляем за собой право изменять эти условия в любое время. Изменения вступают в силу с момента их публикации на сайте.</p>
      <p>Продолжая использовать платформу после изменений, вы соглашаетесь с новыми условиями.</p>
    `
  },
  {
    id: 'termination',
    title: '9. Прекращение доступа',
    content: `
      <p>Мы можем приостановить или прекратить ваш доступ к платформе в случае нарушения этих условий.</p>
      <p>Вы также можете удалить свою учетную запись в любое время через настройки профиля.</p>
    `
  },
  {
    id: 'contact',
    title: '10. Контакты',
    content: `
      <p>Если у вас есть вопросы относительно этих условий, пожалуйста, свяжитесь с нами:</p>
      <div class="contact-info">
        <p>📧 Email: info@mvek.edu</p>
        <p>📞 Телефон: +7 (800) 123-45-67</p>
        <p>📍 Адрес: г. Ижевск, ул. Пушкинская, д. 268Ж</p>
      </div>
    `
  }
]);

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};
</script>
<template>
  <Header />
  <main class="terms-page">
    <div class="container">
      <!-- Хлебные крошки -->
      <nav class="breadcrumbs">
        <router-link to="/" class="breadcrumb-link">Главная</router-link>
        <span class="breadcrumb-separator">/</span>
        <span class="breadcrumb-current">Условия использования</span>
      </nav>

      <!-- Заголовок -->
      <section class="page-header">
        <h1>Условия использования</h1>
        <p class="page-subtitle">Ознакомьтесь с правилами использования нашей платформы</p>
      </section>

      <!-- Основное содержание -->
      <div class="terms-content">
        <!-- Навигация по разделам -->
        <aside class="terms-sidebar">
          <nav class="terms-nav">
            <h3>Содержание</h3>
            <ul>
              <li v-for="section in sections" :key="section.id">
                <a :href="`#${section.id}`" class="nav-link">{{ section.title }}</a>
              </li>
            </ul>
          </nav>
        </aside>

        <!-- Термины -->
        <div class="terms-main">
          <section 
            v-for="section in sections" 
            :key="section.id" 
            :id="section.id" 
            class="terms-section"
          >
            <h2>{{ section.title }}</h2>
            <div v-html="section.content"></div>
          </section>
        </div>
      </div>
    </div>
  </main>
  <Footer />
</template>

<style scoped>
.terms-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* Хлебные крошки */
.breadcrumbs {
  display: flex;
  align-items: center;
  margin-bottom: 30px;
  color: rgba(255, 255, 255, 0.8);
}

.breadcrumb-link {
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  transition: color 0.3s ease;
}

.breadcrumb-link:hover {
  color: #fff;
}

.breadcrumb-separator {
  margin: 0 10px;
}

.breadcrumb-current {
  color: #fff;
  font-weight: 500;
}

/* Заголовок */
.page-header {
  text-align: center;
  margin-bottom: 50px;
  color: white;
}

.page-header h1 {
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 15px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.page-subtitle {
  font-size: 1.2rem;
  opacity: 0.9;
  margin-bottom: 20px;
}

.last-updated {
  font-size: 0.9rem;
  opacity: 0.8;
  background: rgba(255, 255, 255, 0.1);
  padding: 8px 16px;
  border-radius: 20px;
  display: inline-block;
  backdrop-filter: blur(10px);
}

/* Основной контент */
.terms-content {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 40px;
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  min-height: 600px;
}

/* Боковая панель */
.terms-sidebar {
  position: sticky;
  top: 20px;
  height: fit-content;
}

.terms-nav {
  background: #f8f9fa;
  padding: 25px;
  border-radius: 15px;
  border-right: 4px solid #667eea;
}

.terms-nav h3 {
  margin-bottom: 20px;
  color: #2d3748;
  font-size: 1.3rem;
}

.terms-nav ul {
  list-style: none;
  padding: 0;
}

.terms-nav li {
  margin-bottom: 12px;
}

.nav-link {
  color: #4a5568;
  text-decoration: none;
  transition: all 0.3s ease;
  display: block;
  padding: 8px 12px;
  border-radius: 8px;
}

.nav-link:hover {
  color: #667eea;
  background: rgba(102, 126, 234, 0.1);
  transform: translateX(5px);
}

/* Основной контент */
.terms-main {
  color: #2d3748;
}

.terms-section {
  margin-bottom: 50px;
  padding-bottom: 30px;
  border-bottom: 1px solid #e2e8f0;
}

.terms-section:last-of-type {
  border-bottom: none;
}

.terms-section h2 {
  color: #667eea;
  font-size: 1.8rem;
  margin-bottom: 20px;
  font-weight: 600;
}

.terms-section h4 {
  color: #4a5568;
  margin: 25px 0 15px 0;
  font-size: 1.2rem;
}

.terms-section p {
  line-height: 1.7;
  margin-bottom: 15px;
  color: #4a5568;
}

.terms-section ul {
  padding-left: 20px;
  margin-bottom: 20px;
}

.terms-section li {
  margin-bottom: 8px;
  line-height: 1.6;
}

.terms-section strong {
  color: #2d3748;
}

/* Блок соглашения */
.acceptance-box {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2px;
  border-radius: 15px;
  margin-top: 50px;
}

.acceptance-content {
  background: white;
  padding: 30px;
  border-radius: 14px;
  text-align: center;
}

.acceptance-content h3 {
  color: #667eea;
  margin-bottom: 15px;
  font-size: 1.5rem;
}

.acceptance-content p {
  color: #4a5568;
  margin-bottom: 25px;
}

.accept-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 15px 30px;
  border-radius: 50px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
}

.accept-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

/* Ссылки */
.text-link {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
}

.text-link:hover {
  text-decoration: underline;
}

.contact-info {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 10px;
  border-left: 4px solid #667eea;
}

.contact-info p {
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
}

/* Адаптивность */
@media (max-width: 968px) {
  .terms-content {
    grid-template-columns: 1fr;
    gap: 30px;
  }
  
  .terms-sidebar {
    position: static;
  }
  
  .page-header h1 {
    font-size: 2.5rem;
  }
}

@media (max-width: 640px) {
  .container {
    padding: 0 15px;
  }
  
  .terms-content {
    padding: 25px;
  }
  
  .page-header h1 {
    font-size: 2rem;
  }
  
  .terms-section h2 {
    font-size: 1.5rem;
  }
}
</style>