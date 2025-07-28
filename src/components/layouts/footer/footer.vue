<script setup lang="ts">
const currentYear = new Date().getFullYear();

</script>

<template>
  <footer class="site-footer">
    <div class="footer-content">
      <!-- Колонка с информацией о колледже -->
      <div class="footer-column">
        <h3 class="footer-title">МВЕК Колледж</h3>
        <p class="footer-text">
          Ведущее учебное заведение в области дизайна и визуальных искусств.
          Подготовка специалистов с 1998 года.
        </p>
        <div class="footer-contacts">
          <a href="tel:+78001234567" class="contact-link">
            <i class="icon-phone"></i> +7 (800) 123-45-67
          </a>
          <a href="mailto:info@mvek.edu" class="contact-link">
            <i class="icon-mail"></i> info@mvek.edu
          </a>
        </div>
      </div>

      <!-- Колонка с быстрыми ссылками -->
      <div class="footer-column">
        <h3 class="footer-title">Быстрые ссылки</h3>
        <ul class="footer-links">
          <li><router-link to="/about" class="footer-link">О нас</router-link></li>
          <li><router-link to="/students" class="footer-link">Студенты</router-link></li>
          <li><router-link to="/projects" class="footer-link">Проекты</router-link></li>
          <li><router-link to="/teachers" class="footer-link">Преподаватели</router-link></li>
          <li><router-link to="/contacts" class="footer-link">Контакты</router-link></li>
        </ul>
      </div>

      <!-- Колонка с социальными сетями -->
      <div class="footer-column">
        <h3 class="footer-title">Мы в соцсетях</h3>
        <div class="social-icons">
          <a href="#" class="social-icon" aria-label="ВКонтакте">
            <i class="icon-vk"></i>
          </a>
          <a href="#" class="social-icon" aria-label="Telegram">
            <i class="icon-tg"></i>
          </a>
          <a href="#" class="social-icon" aria-label="YouTube">
            <i class="icon-yt"></i>
          </a>
          <a href="#" class="social-icon" aria-label="Instagram">
            <i class="icon-insta"></i>
          </a>
        </div>
        
        <!-- Форма подписки -->
        <div class="newsletter">
          <h4 class="newsletter-title">Подписка на новости</h4>
          <form class="newsletter-form">
            <input 
              type="email" 
              placeholder="Ваш email" 
              class="newsletter-input"
              required
            >
            <button type="submit" class="newsletter-button">
              <i class="icon-send"></i>
            </button>
          </form>
        </div>
      </div>
    </div>

    <!-- Нижняя часть футера -->
    <div class="footer-bottom">
      <div class="footer-copyright">
        &copy; {{ currentYear }} Портфолио МВЕК. Все права защищены.
      </div>
      <div class="footer-developers">
        Разработано <a href="#" class="dev-link">студентами МВЕК</a>
      </div>
      <div class="footer-legal">
        <a href="#" class="legal-link">Политика конфиденциальности</a>
        <a href="#" class="legal-link">Пользовательское соглашение</a>
      </div>
    </div>
  </footer>
</template>
<style scoped>
@import "./footer.scss";
</style>