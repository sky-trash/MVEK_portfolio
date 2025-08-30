import { createRouter, createWebHistory } from 'vue-router'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/firebase'
import HomeView from '@/pages/HomeView.vue'
import RegisterView from '@/pages/RegisterView.vue'
import AuthView from '@/pages/AuthView.vue'
import ProfileView from '@/pages/ProfileView.vue'
import AboutView from '@/pages/AboutView.vue'
import TermsView from '@/pages/TermsView.vue'
import StudentsView from '@/pages/StudentsView.vue'
import TeacherView from '@/pages/TeacherView.vue'
import ContactView from '@/pages/ContactView.vue'
import ProjectsView from '@/pages/ProjectsView.vue'
import StudentProfileView from '@/pages/StudentProfileView.vue'
import TeacherProfileView from '@/pages/TeacherProfileView.vue'
import ProjectDetailsView from '@/pages/ProjectDetailsView.vue'
import NotFoundView from '@/pages/NotFoundView.vue'
import EditProfileView from '@/pages/EditProfileView.vue'
import EditTeacherProfileView from '@/pages/EditTeacherProfileView.vue' 

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: {
      title: 'Главная',
      requiresAuth: false
    }
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterView,
    meta: {
      title: 'Регистрация',
      requiresAuth: false,
      hideForAuth: true
    }
  },
  {
    path: '/auth',
    name: 'auth',
    component: AuthView,
    meta: {
      title: 'Авторизация',
      requiresAuth: false,
      hideForAuth: true
    }
  },
  {
    path: '/profile',
    name: 'profile',
    component: ProfileView,
    meta: {
      title: 'Профиль',
      requiresAuth: true,
      allowedRoles: ['student'] // Только для студентов
    }
  },
  {
    path: '/teacherProfile',
    name: 'teacher-profile-base',
    component: TeacherProfileView,
    meta: {
      title: 'Профиль преподавателя',
      requiresAuth: true,
      allowedRoles: ['teacher'] // Только для преподавателей
    }
  },
  {
    path: '/profile/:id',
    name: 'user-profile',
    component: ProfileView,
    meta: {
      title: 'Профиль пользователя',
      requiresAuth: false
    },
    props: true
  },
  {
    path: '/profile/edit',
    name: 'edit-profile',
    component: EditProfileView,
    meta: {
      title: 'Редактирование профиля',
      requiresAuth: true,
      allowedRoles: ['student'] // Только для студентов
    }
  },
  {
    path: '/teacherProfile/edit',
    name: 'edit-teacher-profile',
    component: EditTeacherProfileView,
    meta: {
      title: 'Редактирование профиля преподавателя',
      requiresAuth: true,
      allowedRoles: ['teacher'] // Только для преподавателей
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
    path: '/terms',
    name: 'terms',
    component: TermsView,
    meta: {
      title: 'Условия использования',
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
    path: '/studentsProfile/:id',
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
    path: '/teacherProfile/:id',
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
    path: '/project/:id',
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
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { top: 0 }
  }
})

// Функция для получения роли пользователя
const getUserRole = async (userId: string): Promise<string> => {
  try {
    // Проверяем localStorage для быстрого доступа
    const cachedRole = localStorage.getItem('userRole');
    if (cachedRole) {
      return cachedRole;
    }
    
    // Если нет в кэше, получаем из базы данных
    const { db } = await import('@/firebase');
    const { collection, query, where, getDocs } = await import('firebase/firestore');
    
    const q = query(collection(db, 'users'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const userData = querySnapshot.docs[0].data();
      const role = userData.role || 'student';
      localStorage.setItem('userRole', role);
      return role;
    }
    
    return 'student';
  } catch (error) {
    console.error('Error getting user role:', error);
    return 'student';
  }
}

// Глобальный перехватчик для проверки авторизации и ролей
router.beforeEach(async (to, from, next) => {
  document.title = to.meta.title as string || 'Портфолио МВЕК'
  
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const hideForAuth = to.matched.some(record => record.meta.hideForAuth)
  const allowedRoles = to.meta.allowedRoles as string[] | undefined
  
  // Используем promise для проверки состояния аутентификации
  const checkAuth = () => {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe()
        resolve(!!user)
      })
    })
  }
  
  const isAuthenticated = await checkAuth()
  
  if (requiresAuth && !isAuthenticated) {
    next('/auth')
  } else if (hideForAuth && isAuthenticated) {
    next('/')
  } else if (requiresAuth && isAuthenticated && allowedRoles) {
    // Проверяем роль пользователя
    const user = auth.currentUser;
    if (user) {
      const userRole = await getUserRole(user.uid);
      
      if (allowedRoles.includes(userRole)) {
        next();
      } else {
        // Перенаправляем в зависимости от роли
        if (userRole === 'teacher') {
          next('/teacherProfile');
        } else {
          next('/profile');
        }
      }
    } else {
      next('/auth');
    }
  } else {
    next()
  }
})

export default router