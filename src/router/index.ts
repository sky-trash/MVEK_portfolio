import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/pages/HomeView.vue'
import RegisterView from '@/pages/RegisterView.vue'
import AuthView from '@/pages/AuthView.vue'
import ProfileView from '@/pages/ProfileView.vue'
import AboutView from '@/pages/AboutView.vue'
import StudentsView from '@/pages/StudentsView.vue'
import TeacherView from '@/pages/TeacherView.vue'
import ContactView from '@/pages/ContactView.vue'
import ProjectsView from '@/pages/ProjectsView.vue'
import StudentProfileView from '@/pages/StudentProfileView.vue'
import TeacherProfileView from '@/pages/TeacherProfileView.vue'
import ProjectDetailsView from '@/pages/ProjectDetailsView.vue'
import NotFoundView from '@/pages/NotFoundView.vue' 

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: {
        title: 'Главная',
        requiresAuth: false // Изменил на requiresAuth для единообразия
      }
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
      meta: {
        title: 'Регистрация',
        requiresAuth: false,
        hideForAuth: true // Скрывать для авторизованных пользователей
      }
    },
    {
      path: '/auth',
      name: 'auth',
      component: AuthView,
      meta: {
        title: 'Авторизация',
        requiresAuth: false,
        hideForAuth: true // Скрывать для авторизованных пользователей
      }
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfileView,
      meta: {
        title: 'Профиль',
        requiresAuth: true // Требует авторизации
      }
    },
    {
      path: '/about',
      name: 'about',
      component: AboutView,
      meta: {
        title: 'О нас',
        requiresAuth: false
      }
    },
    {
      path: '/students',
      name: 'students',
      component: StudentsView,
      meta: {
        title: 'Студенты',
        requiresAuth: false
      }
    },
    {
      path: '/students/:id',
      name: 'student-profile',
      component: StudentProfileView,
      meta: {
        title: 'Профиль студента',
        requiresAuth: false
      },
      props: true
    },
    {
      path: '/teachers',
      name: 'teachers', 
      component: TeacherView,
      meta: {
        title: 'Преподаватели',
        requiresAuth: false
      }
    },
    {
      path: '/teachers/:id',
      name: 'teacher-profile',
      component: TeacherProfileView,
      meta: {
        title: 'Профиль преподавателя',
        requiresAuth: false
      },
      props: true
    },
    {
      path: '/contacts',
      name: 'contacts',
      component: ContactView,
      meta: {
        title: 'Контакты',
        requiresAuth: false
      }
    },
    {
      path: '/projects',
      name: 'projects',
      component: ProjectsView,
      meta: {
        title: 'Проекты',
        requiresAuth: false
      }
    },
    {
      path: '/projects/:id',
      name: 'project-details',
      component: ProjectDetailsView,
      meta: {
        title: 'Детали проекта',
        requiresAuth: false
      },
      props: true
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFoundView,
      meta: {
        title: 'Страница не найдена',
        requiresAuth: false
      }
    }
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// Глобальный перехватчик для изменения title страницы
router.beforeEach((to, from, next) => {
  document.title = to.meta.title as string || 'Портфолио МВЕК'
  next()
})

export default router