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
          <a href="tel:+73412918118" class="contact-link">
            <!-- <i class="icon-phone"></i> +7 (3412) 91-81-18 -->
            📞  +7 (3412) 91-81-18
          </a>
          <a href="mailto:pk@mveu.ru" class="contact-link">
            <!-- <i class="icon-mail"></i>  -->
             📩  pk@mveu.ru
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

        <!-- Форма подписки -->
        <!-- <div class="newsletter">
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
        </div> -->
      </div>
    </div>

    <!-- Нижняя часть футера -->
    <div class="footer-bottom">
      <div class="footer-copyright">
        &copy; {{ currentYear }} Портфолио МВЕК. Все права защищены.
      </div>
      <div class="footer-developers">
        Разработано студентами МВЕК <!--<a href="#" class="dev-link">студентами МВЕК</a> -->
      </div>
      <!-- <div class="footer-legal">
        <a href="#" class="legal-link">Политика конфиденциальности</a>
        <a href="#" class="legal-link">Пользовательское соглашение</a>
      </div> -->
    </div>
  </footer>
</template>
<style scoped>
@import "./footer.scss";
</style>