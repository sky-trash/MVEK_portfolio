<script>
export default {
  name: 'NotFound',
  methods: {
    goBack() {
      this.$router.go(-1);
    }
  }
}
</script>
<template>
  <div class="not-found-container">
    <div class="not-found-content">
      <div class="animation-container">
        <div class="ghost">
          <div class="ghost-body">
            <div class="face">
              <div class="eye left"></div>
              <div class="eye right"></div>
              <div class="mouth"></div>
            </div>
          </div>
          <div class="shadow"></div>
        </div>
      </div>
      
      <h1 class="error-code">404</h1>
      <h2 class="error-title">Упс! Страница потерялась</h2>
      <p class="error-description">
        Кажется, мы не можем найти страницу, которую вы ищете.
        Возможно, она была перемещена или удалена.
      </p>
      
      <div class="action-buttons">
        <router-link to="/" class="home-button">
          <span>Вернуться на главную</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 12H21M21 12L12 3M21 12L12 21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </router-link>
        
        <button @click="goBack" class="back-button">
          <span>Вернуться назад</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 22H15C20 22 22 20 22 15V9C22 4 20 2 15 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M13.26 15.53L9.73999 12L13.26 8.46997" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.not-found-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.not-found-content {
  text-align: center;
  max-width: 600px;
  width: 100%;
  padding: 40px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  box-shadow: 0 15px 35px rgba(50, 50, 93, 0.1), 0 5px 15px rgba(0, 0, 0, 0.07);
  backdrop-filter: blur(10px);
}

.animation-container {
  margin-bottom: 30px;
}

// Ghost animation
.ghost {
  position: relative;
  width: 120px;
  height: 135px;
  margin: 0 auto;
  animation: float 3s ease-in-out infinite;
}

.ghost-body {
  position: relative;
  width: 120px;
  height: 120px;
  background: white;
  border-radius: 50% 50% 0 0;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.face {
  position: absolute;
  top: 40px;
  left: 50%;
  transform: translateX(-50%);
  width: 70px;
  height: 40px;
}

.eye {
  position: absolute;
  top: 0;
  width: 18px;
  height: 18px;
  background: #2c3e50;
  border-radius: 50%;
  animation: blink 4s infinite;
}

.eye.left {
  left: 0;
}

.eye.right {
  right: 0;
}

.mouth {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 30px;
  height: 10px;
  background: #2c3e50;
  border-radius: 0 0 10px 10px;
}

.shadow {
  position: absolute;
  bottom: -15px;
  left: 50%;
  transform: translateX(-50%);
  width: 80px;
  height: 10px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  animation: scale 3s ease-in-out infinite;
}

.error-code {
  font-size: 8rem;
  font-weight: 900;
  margin: 0 0 10px;
  color: #2c3e50;
  text-shadow: 3px 3px 0px rgba(0, 0, 0, 0.1);
  line-height: 1;
}

.error-title {
  font-size: 1.8rem;
  font-weight: 600;
  margin: 0 0 15px;
  color: #34495e;
}

.error-description {
  font-size: 1.1rem;
  line-height: 1.6;
  color: #7f8c8d;
  margin: 0 0 30px;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 15px;
  flex-wrap: wrap;
}

.home-button, .back-button {
  display: inline-flex;
  align-items: center;
  padding: 12px 24px;
  border-radius: 50px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s ease;
  font-size: 1rem;
  cursor: pointer;
  border: none;
  
  svg {
    margin-left: 8px;
    transition: transform 0.3s ease;
  }
  
  &:hover {
    svg {
      transform: translateX(4px);
    }
  }
}

.home-button {
  background: #3498db;
  color: white;
  
  &:hover {
    background: #2980b9;
    transform: translateY(-2px);
    box-shadow: 0 7px 14px rgba(52, 152, 219, 0.4);
  }
}

.back-button {
  background: transparent;
  color: #7f8c8d;
  border: 2px solid #e0e0e0;
  
  &:hover {
    background: #f8f9fa;
    color: #34495e;
    border-color: #d0d0d0;
    transform: translateY(-2px);
    box-shadow: 0 7px 14px rgba(0, 0, 0, 0.1);
  }
}

// Animations
@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-15px);
  }
}

@keyframes scale {
  0%, 100% {
    transform: translateX(-50%) scale(1);
  }
  50% {
    transform: translateX(-50%) scale(0.9);
  }
}

@keyframes blink {
  0%, 95%, 98%, 100% {
    height: 18px;
  }
  96%, 99% {
    height: 2px;
  }
}

// Responsive design
@media (max-width: 600px) {
  .not-found-content {
    padding: 30px 20px;
  }
  
  .error-code {
    font-size: 6rem;
  }
  
  .error-title {
    font-size: 1.5rem;
  }
  
  .action-buttons {
    flex-direction: column;
    align-items: center;
  }
  
  .home-button, .back-button {
    width: 100%;
    justify-content: center;
  }
}
</style>