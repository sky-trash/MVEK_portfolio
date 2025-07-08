import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../pages/HomeView.vue'
import RegisterView from '@/pages/RegisterView.vue'
import AuthView from '@/pages/AuthView.vue'
import ProfileView from '@/pages/ProfileView.vue'
import AboutView from '@/pages/AboutView.vue'
import StudentsView from '@/pages/StudentsView.vue'
import TeacherView from '@/pages/TeacherView.vue'
import ContactView from '@/pages/ContactView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: {
        title: 'Главаня',
        requiresUnauth: true
      }
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
      meta: {
        title: 'Регистрация',
        requiresUnauth: true
      }
    },
    {
      path: '/auth',
      name: 'auth',
      component: AuthView,
      meta: {
        title: 'Авторизация',
        requiresUnauth: true
      }
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfileView,
      meta: {
        title: 'Профиль',
        requiresUnauth: true
      }
    },
    {
      path: '/about',
      name: 'about',
      component: AboutView,
      meta: {
        title: 'О нас',
        requiresUnauth: true
      }
    },
    {
      path: '/students',
      name: 'students',
      component: StudentsView,
      meta: {
        title: 'Студенты',
        requiresUnauth: true
      }
    },
    {
      path: '/teacher',
      name: 'teacher',
      component: TeacherView,
      meta: {
        title: 'Преподователи',
        requiresUnauth: true
      }
    },
    {
      path: '/contact',
      name: 'contact',
      component: ContactView,
      meta: {
        title: 'Контакты',
        requiresUnauth: true
      }
    },
  ],
})

export default router
