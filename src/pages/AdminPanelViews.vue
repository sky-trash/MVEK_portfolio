<script>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  query,
  where
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/firebase';

export default {
  name: 'AdminPanel',
  setup() {
    const router = useRouter();
    const activeTab = ref('users');

    // Users management
    const users = ref([]);
    const searchQuery = ref('');
    const roleFilter = ref('');
    const showAddUserModal = ref(false);
    const editingUser = ref(null);
    const userForm = ref({
      displayName: '',
      email: '',
      password: '',
      role: 'student',
      group: ''
    });

    // Projects management
    const projects = ref([]);
    const projectSearchQuery = ref('');
    const projectTypeFilter = ref('');

    // Reviews management
    const reviews = ref([]);

    // Statistics
    const stats = ref({
      totalUsers: 0,
      totalProjects: 0,
      activeReviews: 0
    });

    // Settings
    const settings = ref({
      siteName: 'Портфолио МВЕК',
      siteDescription: 'Платформа для демонстрации студенческих работ',
      notificationEmail: ''
    });

    const tabs = [
      { id: 'users', text: 'Пользователи', icon: '👥' },
      { id: 'projects', text: 'Проекты', icon: '📁' },
      // { id: 'reviews', text: 'Отзывы', icon: '⭐' },
      { id: 'statistics', text: 'Статистика', icon: '📊' },
      { id: 'settings', text: 'Настройки', icon: '⚙️' }
    ];

    // Computed properties
    const filteredUsers = computed(() => {
      return users.value.filter(user => {
        const matchesSearch = user.displayName?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchQuery.value.toLowerCase());
        const matchesRole = !roleFilter.value || user.role === roleFilter.value;
        return matchesSearch && matchesRole;
      });
    });

    const filteredProjects = computed(() => {
      return projects.value.filter(project => {
        const matchesSearch = project.title?.toLowerCase().includes(projectSearchQuery.value.toLowerCase()) ||
          project.authorName?.toLowerCase().includes(projectSearchQuery.value.toLowerCase());
        const matchesType = !projectTypeFilter.value || project.type === projectTypeFilter.value;
        return matchesSearch && matchesType;
      });
    });

    // Methods
    const changeTab = (tab) => {
      activeTab.value = tab;
    };

    const handleLogout = async () => {
      try {
        await auth.signOut();
        router.push('/auth');
      } catch (error) {
        console.error('Logout error:', error);
      }
    };

    // Users methods
    const loadUsers = () => {
      const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
        users.value = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        stats.value.totalUsers = users.value.length;
      });
      return unsubscribe;
    };

    const editUser = (user) => {
      editingUser.value = user;
      userForm.value = { ...user };
      showAddUserModal.value = true;
    };

    const saveUser = async () => {
      try {
        if (editingUser.value) {
          const userRef = doc(db, 'users', editingUser.value.id);
          await updateDoc(userRef, userForm.value);
        } else {
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            userForm.value.email,
            userForm.value.password
          );

          await addDoc(collection(db, 'users'), {
            uid: userCredential.user.uid,
            displayName: userForm.value.displayName,
            email: userForm.value.email,
            role: userForm.value.role,
            group: userForm.value.group,
            status: 'active',
            createdAt: new Date()
          });
        }

        closeModal();
      } catch (error) {
        console.error('Error saving user:', error);
      }
    };

    const updateUserRole = async (userId, newRole) => {
      try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, { role: newRole });
      } catch (error) {
        console.error('Error updating user role:', error);
      }
    };

    const deleteUser = async (userId) => {
      if (confirm('Вы уверены, что хотите удалить этого пользователя?')) {
        try {
          await deleteDoc(doc(db, 'users', userId));
        } catch (error) {
          console.error('Error deleting user:', error);
        }
      }
    };

    const closeModal = () => {
      showAddUserModal.value = false;
      editingUser.value = null;
      userForm.value = {
        displayName: '',
        email: '',
        password: '',
        role: 'student',
        group: ''
      };
    };

    // Projects methods
    const loadProjects = () => {
      const unsubscribe = onSnapshot(collection(db, 'projects'), (snapshot) => {
        projects.value = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        stats.value.totalProjects = projects.value.length;
      });
      return unsubscribe;
    };

    const editProject = (project) => {
      // Реализация редактирования проекта
      console.log('Edit project:', project);
    };

    const deleteProject = async (projectId) => {
      if (confirm('Вы уверены, что хотите удалить этот проект?')) {
        try {
          await deleteDoc(doc(db, 'projects', projectId));
        } catch (error) {
          console.error('Error deleting project:', error);
        }
      }
    };

    // Reviews methods
    const loadReviews = () => {
      const unsubscribe = onSnapshot(collection(db, 'reviews'), (snapshot) => {
        reviews.value = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        stats.value.activeReviews = reviews.value.filter(r => r.status === 'approved').length;
      });
      return unsubscribe;
    };

    const approveReview = async (reviewId) => {
      try {
        const reviewRef = doc(db, 'reviews', reviewId);
        await updateDoc(reviewRef, { status: 'approved' });
      } catch (error) {
        console.error('Error approving review:', error);
      }
    };

    const rejectReview = async (reviewId) => {
      try {
        const reviewRef = doc(db, 'reviews', reviewId);
        await updateDoc(reviewRef, { status: 'rejected' });
      } catch (error) {
        console.error('Error rejecting review:', error);
      }
    };

    // Settings methods
    const saveSettings = async () => {
      try {
        // Сохранение настроек в Firestore
        const settingsRef = doc(db, 'settings', 'general');
        await updateDoc(settingsRef, settings.value);
        alert('Настройки сохранены успешно!');
      } catch (error) {
        console.error('Error saving settings:', error);
      }
    };

    // Load data on mount
    onMounted(() => {
      const unsubscribeUsers = loadUsers();
      const unsubscribeProjects = loadProjects();
      const unsubscribeReviews = loadReviews();

      // Cleanup on unmount
      return () => {
        unsubscribeUsers();
        unsubscribeProjects();
        unsubscribeReviews();
      };
    });

    return {
      activeTab,
      users,
      searchQuery,
      roleFilter,
      showAddUserModal,
      editingUser,
      userForm,
      projects,
      projectSearchQuery,
      projectTypeFilter,
      reviews,
      stats,
      settings,
      tabs,
      filteredUsers,
      filteredProjects,
      changeTab,
      handleLogout,
      editUser,
      saveUser,
      updateUserRole,
      deleteUser,
      closeModal,
      editProject,
      deleteProject,
      approveReview,
      rejectReview,
      saveSettings
    };
  }
};
</script>
<template>
  <header class="simple-header">
    <h1>Панель администратора</h1>
    <button @click="handleLogout">Выйти</button>
  </header>
  <div class="admin-panel">
    <!-- Main Content -->
    <div class="admin-container">
      <!-- Sidebar -->
      <aside class="admin-sidebar">
        <nav class="sidebar-nav">
          <button v-for="tab in tabs" :key="tab.id" :class="['nav-item', { active: activeTab === tab.id }]"
            @click="changeTab(tab.id)">
            <span class="nav-icon">{{ tab.icon }}</span>
            <span class="nav-text">{{ tab.text }}</span>
          </button>
        </nav>
      </aside>

      <!-- Content Area -->
      <div class="admin-content">
        <!-- Users Management -->
        <div v-if="activeTab === 'users'" class="users-management">
          <div class="page-header">
            <h2>Управление пользователями</h2>
            <!-- <button @click="showAddUserModal = true" class="add-btn">
              Добавить пользователя
            </button> -->
          </div>

          <div class="filters">
            <input v-model="searchQuery" placeholder="Поиск пользователей..." class="search-input" />
            <select v-model="roleFilter" class="filter-select">
              <option value="">Все роли</option>
              <option value="student">Студент</option>
              <option value="teacher">Преподаватель</option>
              <option value="moderator">Модератор</option>
            </select>
          </div>

          <div class="users-table">
            <table>
              <thead>
                <tr>
                  <th>Имя</th>
                  <th>Email</th>
                  <th>Роль</th>
                  <th>Группа</th>
                  <th>Статус</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in filteredUsers" :key="user.id">
                  <td>{{ user.name }}</td>
                  <td>{{ user.email }}</td>
                  <td>
                    <select :value="user.role" @change="updateUserRole(user.id, $event.target.value)"
                      class="role-select">
                      <option value="student">Студент</option>
                      <option value="teacher">Преподаватель</option>
                      <option value="moderator">Модератор</option>
                      <option value="admin">Администратор</option>
                    </select>
                  </td>
                  <td>{{ user.group || '-' }}</td>
                  <td>
                    <span :class="['status', user.status]">
                      {{ user.status === 'active' ? 'Активен' : 'Неактивен' }}
                    </span>
                  </td>
                  <td>
                    <button @click="editUser(user)" class="edit-btn">✏️</button>
                    <button @click="deleteUser(user.id)" class="delete-btn">🗑️</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Add/Edit User Modal -->
          <div v-if="showAddUserModal" class="modal">
            <div class="modal-content">
              <h3>{{ editingUser ? 'Редактировать' : 'Добавить' }} пользователя</h3>
              <form @submit.prevent="saveUser">
                <div class="form-group">
                  <label>Имя:</label>
                  <input v-model="userForm.displayName" required />
                </div>
                <div class="form-group">
                  <label>Email:</label>
                  <input v-model="userForm.email" type="email" required />
                </div>
                <div class="form-group">
                  <label>Пароль:</label>
                  <input v-model="userForm.password" type="password" :required="!editingUser" />
                </div>
                <div class="form-group">
                  <label>Роль:</label>
                  <select v-model="userForm.role" required>
                    <option value="student">Студент</option>
                    <option value="teacher">Преподаватель</option>
                    <option value="moderator">Модератор</option>
                    <option value="admin">Администратор</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Группа:</label>
                  <input v-model="userForm.group" />
                </div>
                <div class="form-actions">
                  <button type="button" @click="closeModal">Отмена</button>
                  <button type="submit">Сохранить</button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <!-- Projects Management -->
        <div v-else-if="activeTab === 'projects'" class="projects-management">
          <div class="page-header">
            <h2>Управление проектами</h2>
          </div>

          <div class="filters">
            <input v-model="projectSearchQuery" placeholder="Поиск проектов..." class="search-input" />
            <!-- <select v-model="projectTypeFilter" class="filter-select">
              <option value="">Все типы</option>
              <option value="design">Дизайн</option>
              <option value="development">Разработка</option>
              <option value="art">Арт</option>
            </select> -->
          </div>

          <div class="projects-grid">
            <div v-for="project in filteredProjects" :key="project.id" class="project-card">
              <div class="project-image">
                <img :src="project.images[0]" :alt="project.title" />
              </div>
              <div class="project-info">
                <h3>{{ project.title }}</h3>
                <p class="project-type">{{ project.type }}</p>
                <p class="project-author">Автор: {{ project.authorName }}</p>
                <div class="project-stats">
                  <span>👁️ {{ project.views }}</span>
                  <span>⭐ {{ project.rating }}</span>
                </div>
              </div>
              <div class="project-actions">
                <button @click="editProject(project)" class="edit-btn">✏️</button>
                <button @click="deleteProject(project.id)" class="delete-btn">🗑️</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Reviews Management -->
        <!-- <div v-else-if="activeTab === 'reviews'" class="reviews-management">
          <div class="page-header">
            <h2>Модерация отзывов</h2>
          </div>

          <div class="reviews-list">
            <div v-for="review in reviews" :key="review.id" class="review-card">
              <div class="review-header">
                <span class="review-author">{{ review.authorName }}</span>
                <span class="review-rating">⭐ {{ review.rating }}/5</span>
              </div>
              <p class="review-text">{{ review.text }}</p>
              <div class="review-actions">
                <button @click="approveReview(review.id)" class="approve-btn">✅ Одобрить</button>
                <button @click="rejectReview(review.id)" class="reject-btn">❌ Отклонить</button>
              </div>
            </div>
          </div>
        </div> -->

        <!-- Statistics -->
        <div v-else-if="activeTab === 'statistics'" class="statistics">
          <div class="page-header">
            <h2>Статистика</h2>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <h3>Всего пользователей</h3>
              <p class="stat-number">{{ stats.totalUsers }}</p>
            </div>
            <div class="stat-card">
              <h3>Всего проектов</h3>
              <p class="stat-number">{{ stats.totalProjects }}</p>
            </div>
            <div class="stat-card">
              <h3>Активных отзывов</h3>
              <p class="stat-number">{{ stats.activeReviews }}</p>
            </div>
          </div>

          <div class="charts">
            <div class="chart-section">
              <h3>Распределение по ролям</h3>
              <div class="chart">
                <!-- Здесь будет график -->
                <div class="chart-placeholder">График ролей пользователей</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Settings -->
        <div v-else-if="activeTab === 'settings'" class="settings">
          <div class="page-header">
            <h2>Настройки системы</h2>
          </div>

          <div class="settings-form">
            <div class="form-group">
              <label>Название сайта:</label>
              <input v-model="settings.siteName" />
            </div>
            <div class="form-group">
              <label>Описание сайта:</label>
              <textarea v-model="settings.siteDescription"></textarea>
            </div>
            <div class="form-group">
              <label>Email для уведомлений:</label>
              <input v-model="settings.notificationEmail" type="email" />
            </div>
            <button @click="saveSettings" class="save-btn">Сохранить настройки</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "sass:color";
$primary-color: #3498db;
$secondary-color: #2c3e50;
$accent-color: #e74c3c;
$success-color: #27ae60;
$warning-color: #f39c12;
$light-bg: #f8f9fa;
$dark-bg: #34495e;
$text-light: #ffffff;
$text-dark: #333333;
$text-gray: #666666;
$border-color: #ddd;
$shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
$radius: 8px;
$transition: all 0.3s ease;

.simple-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #2c3e50;
  color: white;

  button {
    background-color: #dc4c4c;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 4px 6px;
    cursor: pointer;
    font-size: 14px;
  }
}

// Mixins
@mixin flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

@mixin flex-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

@mixin card {
  background: white;
  border-radius: $radius;
  box-shadow: $shadow;
  overflow: hidden;
}

@mixin button($bg-color, $text-color: white) {
  padding: 8px 16px;
  background-color: $bg-color;
  color: $text-color;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: $transition;

  &:hover {
    background-color: color.adjust($bg-color, $lightness: -10%);
  }
}

@mixin input {
  padding: 8px 12px;
  border: 1px solid $border-color;
  border-radius: 4px;
  width: 100%;

  &:focus {
    outline: none;
    border-color: $primary-color;
    box-shadow: 0 0 0 2px rgba($primary-color, 0.2);
  }
}

// Admin Panel Styles
.admin-panel {
  min-height: 100vh;
  background-color: $light-bg;
}

.admin-header {
  @include flex-between;
  padding: 0 20px;
  height: 64px;
  background-color: $secondary-color;
  color: $text-light;
  box-shadow: $shadow;

  .header-left {
    h1 {
      margin: 0;
      font-size: 1.5rem;
    }
  }

  .header-right {
    @include flex-center;
    gap: 15px;

    .user-info {
      font-weight: 500;
    }

    .logout-btn {
      @include button($accent-color);
    }
  }
}

.admin-container {
  display: flex;
  min-height: calc(100vh - 64px);
}

.admin-sidebar {
  width: 250px;
  background-color: $dark-bg;
  color: $text-light;
  padding: 20px 0;

  .sidebar-nav {
    display: flex;
    flex-direction: column;

    .nav-item {
      @include flex-center;
      padding: 15px 20px;
      background: none;
      border: none;
      color: $text-light;
      text-align: left;
      cursor: pointer;
      transition: $transition;
      gap: 10px;

      &:hover {
        background-color: darken($dark-bg, 5%);
      }

      &.active {
        background-color: $primary-color;
        border-right: 3px solid darken($primary-color, 10%);
      }

      .nav-icon {
        font-size: 1.2rem;
      }

      .nav-text {
        font-weight: 500;
      }
    }
  }
}

.admin-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

// Common Styles
.page-header {
  @include flex-between;
  margin-bottom: 20px;

  h2 {
    margin: 0;
    color: $secondary-color;
  }

  .add-btn {
    @include button($primary-color);
  }
}

.filters {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;

  .search-input,
  .filter-select {
    @include input;
    width: 200px;
  }
}

// Users Management
.users-management {
  .users-table {
    @include card;

    table {
      width: 100%;
      border-collapse: collapse;

      th,
      td {
        padding: 12px;
        text-align: left;
        border-bottom: 1px solid $border-color;
      }

      th {
        background-color: $light-bg;
        font-weight: 600;
        color: $secondary-color;
      }
    }

    .role-select {
      @include input;
      padding: 4px 8px;
    }

    .status {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;

      &.active {
        background-color: lighten($success-color, 45%);
        color: darken($success-color, 20%);
      }

      &.inactive {
        background-color: lighten($accent-color, 35%);
        color: darken($accent-color, 20%);
      }
    }

    .edit-btn,
    .delete-btn {
      padding: 6px;
      border: none;
      background: none;
      cursor: pointer;
      font-size: 16px;
      transition: $transition;

      &.edit-btn:hover {
        color: $primary-color;
      }

      &.delete-btn:hover {
        color: $accent-color;
      }
    }
  }

  .modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    @include flex-center;
    z-index: 1000;

    .modal-content {
      background: white;
      padding: 30px;
      border-radius: $radius;
      width: 400px;
      max-width: 90%;

      h3 {
        margin-bottom: 20px;
        color: $secondary-color;
      }

      .form-group {
        margin-bottom: 15px;

        label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
          color: $secondary-color;
        }

        input,
        select {
          @include input;
        }
      }

      .form-actions {
        display: flex;
        gap: 10px;
        justify-content: flex-end;
        margin-top: 20px;

        button {
          @include button($border-color, $text-dark);

          &[type="submit"] {
            @include button($primary-color);
          }
        }
      }
    }
  }
}

// Projects Management
.projects-management {
  .projects-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
  }

  .project-card {
    @include card;

    .project-image {
      height: 200px;
      overflow: hidden;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: $transition;

        &:hover {
          transform: scale(1.05);
        }
      }
    }

    .project-info {
      padding: 15px;

      h3 {
        margin: 0 0 10px 0;
        color: $secondary-color;
      }

      .project-type {
        color: $text-gray;
        margin: 0 0 10px 0;
      }

      .project-author {
        color: $text-dark;
        margin: 0 0 10px 0;
      }

      .project-stats {
        display: flex;
        gap: 15px;
        color: $text-gray;
      }
    }

    .project-actions {
      padding: 15px;
      border-top: 1px solid $border-color;
      display: flex;
      gap: 10px;

      .edit-btn,
      .delete-btn {
        @extend .edit-btn, .delete-btn;
      }
    }
  }
}

// Reviews Management
.reviews-management {
  .reviews-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .review-card {
    @include card;
    padding: 20px;

    .review-header {
      @include flex-between;
      margin-bottom: 10px;

      .review-author {
        font-weight: 500;
        color: $secondary-color;
      }

      .review-rating {
        color: $warning-color;
        font-weight: 500;
      }
    }

    .review-text {
      margin: 0 0 15px 0;
      line-height: 1.5;
      color: $text-dark;
    }

    .review-actions {
      display: flex;
      gap: 10px;

      .approve-btn {
        @include button($success-color);
      }

      .reject-btn {
        @include button($accent-color);
      }
    }
  }
}

// Statistics
.statistics {
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
  }

  .stat-card {
    @include card;
    padding: 20px;
    text-align: center;

    h3 {
      margin: 0 0 10px 0;
      color: $secondary-color;
      font-size: 1rem;
    }

    .stat-number {
      font-size: 2rem;
      font-weight: bold;
      color: $primary-color;
      margin: 0;
    }
  }

  .charts {
    @include card;
    padding: 20px;

    .chart-section {
      margin-bottom: 20px;

      h3 {
        margin-bottom: 15px;
        color: $secondary-color;
      }
    }

    .chart-placeholder {
      height: 200px;
      background: $light-bg;
      border: 2px dashed $border-color;
      border-radius: $radius;
      @include flex-center;
      color: $text-gray;
    }
  }
}

// Settings
.settings {
  .settings-form {
    @include card;
    padding: 20px;

    .form-group {
      margin-bottom: 20px;

      label {
        display: block;
        margin-bottom: 5px;
        font-weight: 500;
        color: $secondary-color;
      }

      input,
      textarea {
        @include input;
      }

      textarea {
        height: 80px;
        resize: vertical;
      }
    }

    .save-btn {
      @include button($success-color);
      margin-top: 20px;
    }
  }
}

@media (max-width: 768px) {
  .admin-container {
    flex-direction: column;
  }

  .admin-sidebar {
    width: 100%;
    order: 2;
  }

  .admin-content {
    order: 1;
  }

  .filters {
    flex-direction: column;

    .search-input,
    .filter-select {
      width: 100%;
    }
  }

  .projects-grid {
    grid-template-columns: 1fr !important;
  }

  .stats-grid {
    grid-template-columns: 1fr !important;
  }
}
</style>