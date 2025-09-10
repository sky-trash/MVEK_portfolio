<script>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  deleteUser as deleteAuthUser,
  getAuth
} from 'firebase/auth';
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

    // Groups and specialties management
    const groups = ref([]);
    const specialties = ref([]);
    const newGroup = ref('');
    const newSpecialty = ref('');
    const showAddGroupModal = ref(false);
    const showAddSpecialtyModal = ref(false);

    // Reviews management
    const reviews = ref([]);

    // Statistics
    const stats = ref({
      totalUsers: 0,
      totalProjects: 0,
      activeReviews: 0,
      totalGroups: 0,
      totalSpecialties: 0
    });

    const tabs = [
      { id: 'users', text: 'Пользователи', icon: '👥' },
      { id: 'projects', text: 'Проекты', icon: '📁' },
      { id: 'groups', text: 'Группы', icon: '🎓' },
      { id: 'specialties', text: 'Специальности', icon: '📚' },
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

    const getUserInitials = (user) => {
      const name = user.displayName || user.name || '';
      return name.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
    };

    const getUserStatusText = (status) => {
      return (status || 'active') === 'active' ? 'Активен' : 'Неактивен';
    };

    const formatDate = (timestamp) => {
      if (!timestamp) return '-';
      return new Date(timestamp.seconds * 1000).toLocaleDateString('ru-RU');
    };

    const getUsersInGroup = (groupName) => {
      return users.value.filter(user => user.group === groupName);
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
      userForm.value = {
        displayName: user.displayName || user.name || '',
        email: user.email || '',
        password: '',
        role: user.role || 'student',
        group: user.group || ''
      };
      showAddUserModal.value = true;
    };

    const saveUser = async () => {
      try {
        if (editingUser.value) {
          const userRef = doc(db, 'users', editingUser.value.id);
          await updateDoc(userRef, {
            displayName: userForm.value.displayName,
            email: userForm.value.email,
            role: userForm.value.role,
            group: userForm.value.group
          });
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
        alert('Ошибка при сохранении пользователя: ' + error.message);
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

    const deleteUserAccount = async (user) => {
      if (!confirm(`Вы уверены, что хотите удалить пользователя ${user.displayName || user.email}?`)) {
        return;
      }

      try {
        // Удаляем из Firestore
        await deleteDoc(doc(db, 'users', user.id));

        // Пытаемся удалить из Authentication
        try {
          if (user.uid) {
            const currentUser = auth.currentUser;
            if (currentUser && currentUser.uid !== user.uid) {
              // Для удаления пользователя из Authentication нужны права администратора
              // В реальном приложении это должно делаться через Cloud Functions
              console.log('Требуются права администратора для удаления из Authentication');
            }
          }
        } catch (authError) {
          console.warn('Не удалось удалить пользователя из Authentication:', authError);
        }

      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Ошибка при удалении пользователя: ' + error.message);
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

    // Groups methods
    const loadGroups = () => {
      const unsubscribe = onSnapshot(collection(db, 'groups'), (snapshot) => {
        groups.value = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })).sort((a, b) => a.name.localeCompare(b.name));
        stats.value.totalGroups = groups.value.length;
      });
      return unsubscribe;
    };

    const addGroup = async () => {
      if (!newGroup.value.trim()) return;

      try {
        await addDoc(collection(db, 'groups'), {
          name: newGroup.value.trim(),
          createdAt: new Date()
        });
        newGroup.value = '';
        showAddGroupModal.value = false;
      } catch (error) {
        console.error('Error adding group:', error);
        alert('Ошибка при добавлении группы: ' + error.message);
      }
    };

    const deleteGroup = async (groupId) => {
      if (!confirm('Вы уверены, что хотите удалить эту группу?')) return;

      try {
        // Проверяем, есть ли пользователи в этой группе
        const group = groups.value.find(g => g.id === groupId);
        const usersInGroup = getUsersInGroup(group.name);

        if (usersInGroup.length > 0) {
          if (!confirm(`В этой группе ${usersInGroup.length} пользователь(ей). Удалить группу вместе с пользователями?`)) {
            return;
          }
        }

        await deleteDoc(doc(db, 'groups', groupId));
      } catch (error) {
        console.error('Error deleting group:', error);
        alert('Ошибка при удалении группы: ' + error.message);
      }
    };

    // Specialties methods
    const loadSpecialties = () => {
      const unsubscribe = onSnapshot(collection(db, 'specialties'), (snapshot) => {
        specialties.value = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })).sort((a, b) => a.name.localeCompare(b.name));
        stats.value.totalSpecialties = specialties.value.length;
      });
      return unsubscribe;
    };

    const addSpecialty = async () => {
      if (!newSpecialty.value.trim()) return;

      try {
        await addDoc(collection(db, 'specialties'), {
          name: newSpecialty.value.trim(),
          createdAt: new Date()
        });
        newSpecialty.value = '';
        showAddSpecialtyModal.value = false;
      } catch (error) {
        console.error('Error adding specialty:', error);
        alert('Ошибка при добавлении специальности: ' + error.message);
      }
    };

    const deleteSpecialty = async (specialtyId) => {
      if (!confirm('Вы уверены, что хотите удалить эту специальность?')) return;

      try {
        await deleteDoc(doc(db, 'specialties', specialtyId));
      } catch (error) {
        console.error('Error deleting specialty:', error);
        alert('Ошибка при удалении специальности: ' + error.message);
      }
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
      console.log('Edit project:', project);
      // Реализация редактирования проекта
    };

    const deleteProject = async (projectId) => {
      if (!confirm('Вы уверены, что хотите удалить этот проект?')) return;

      try {
        await deleteDoc(doc(db, 'projects', projectId));
      } catch (error) {
        console.error('Error deleting project:', error);
        alert('Ошибка при удалении проекта: ' + error.message);
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

    // Load data on mount
    onMounted(() => {
      const unsubscribeUsers = loadUsers();
      const unsubscribeProjects = loadProjects();
      const unsubscribeGroups = loadGroups();
      const unsubscribeSpecialties = loadSpecialties();
      const unsubscribeReviews = loadReviews();

      return () => {
        unsubscribeUsers();
        unsubscribeProjects();
        unsubscribeGroups();
        unsubscribeSpecialties();
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
      groups,
      specialties,
      newGroup,
      newSpecialty,
      showAddGroupModal,
      showAddSpecialtyModal,
      reviews,
      stats,
      tabs,
      filteredUsers,
      filteredProjects,
      changeTab,
      handleLogout,
      getUserInitials,
      getUserStatusText,
      formatDate,
      getUsersInGroup,
      editUser,
      saveUser,
      updateUserRole,
      deleteUserAccount,
      closeModal,
      addGroup,
      deleteGroup,
      addSpecialty,
      deleteSpecialty,
      editProject,
      deleteProject
    };
  }
};
</script>
<template>
  <header class="simple-header">
    <h1>Панель администратора</h1>
    <button @click="handleLogout" class="logout-btn">Выйти</button>
  </header>
  <div class="admin-panel">
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

        <!-- Статистика -->
        <div class="sidebar-stats">
          <h3>Статистика</h3>
          <div class="stat-item">
            <span class="stat-icon">👥</span>
            <span>Пользователи: {{ stats.totalUsers }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-icon">📁</span>
            <span>Проекты: {{ stats.totalProjects }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-icon">⭐</span>
            <span>Отзывы: {{ stats.activeReviews }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-icon">🎓</span>
            <span>Группы: {{ stats.totalGroups }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-icon">📚</span>
            <span>Специальности: {{ stats.totalSpecialties }}</span>
          </div>
        </div>
      </aside>

      <!-- Content Area -->
      <div class="admin-content">
        <!-- Users Management -->
        <div v-if="activeTab === 'users'" class="users-management">
          <div class="page-header">
            <h2>Управление пользователями</h2>
            <button @click="showAddUserModal = true" class="add-btn">
              ＋ Добавить пользователя
            </button>
          </div>

          <div class="filters">
            <input v-model="searchQuery" placeholder="Поиск по имени или email..." class="search-input" />
            <select v-model="roleFilter" class="filter-select">
              <option value="">Все роли</option>
              <option value="student">Студент</option>
              <option value="teacher">Преподаватель</option>
              <option value="admin">Администратор</option>
            </select>
          </div>

          <div class="table-container">
            <table class="users-table">
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
                  <td class="user-name">
                    <span class="avatar">{{ getUserInitials(user) }}</span>
                    {{ user.displayName || user.name || '-' }}
                  </td>
                  <td>{{ user.email }}</td>
                  <td>
                    <select :value="user.role" @change="updateUserRole(user.id, $event.target.value)"
                      class="role-select">
                      <option value="student">Студент</option>
                      <option value="teacher">Преподаватель</option>
                      <option value="admin">Администратор</option>
                    </select>
                  </td>
                  <td>{{ user.group || '-' }}</td>
                  <td>
                    <span :class="['status-badge', user.status || 'active']">
                      {{ getUserStatusText(user.status) }}
                    </span>
                  </td>
                  <td>
                    <div class="action-buttons">
                      <button @click="editUser(user)" class="action-btn edit" title="Редактировать">
                        ✏️
                      </button>
                      <button @click="deleteUserAccount(user)" class="action-btn delete" title="Удалить">
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-if="filteredUsers.length === 0" class="empty-state">
              <p>Пользователи не найдены</p>
            </div>
          </div>

          <!-- Add/Edit User Modal -->
          <div v-if="showAddUserModal" class="modal-overlay" @click.self="closeModal">
            <div class="modal">
              <div class="modal-header">
                <h3>{{ editingUser ? 'Редактировать' : 'Добавить' }} пользователя</h3>
                <button @click="closeModal" class="modal-close">×</button>
              </div>
              <form @submit.prevent="saveUser" class="modal-form">
                <div class="form-group">
                  <label>Имя:</label>
                  <input v-model="userForm.displayName" required class="form-input" />
                </div>
                <div class="form-group">
                  <label>Роль:</label>
                  <select v-model="userForm.role" required class="form-select">
                    <option value="student">Студент</option>
                    <option value="teacher">Преподаватель</option>
                    <option value="admin">Администратор</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Группа:</label>
                  <select v-model="userForm.group" class="form-select">
                    <option value="">Не указана</option>
                    <option v-for="group in groups" :key="group.id" :value="group.name">
                      {{ group.name }}
                    </option>
                  </select>
                </div>
                <div class="form-actions">
                  <button type="button" @click="closeModal" class="btn btn-secondary">Отмена</button>
                  <button type="submit" class="btn btn-primary">Сохранить</button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <!-- Groups Management -->
        <div v-else-if="activeTab === 'groups'" class="groups-management">
          <div class="page-header">
            <h2>Управление группами</h2>
            <button @click="showAddGroupModal = true" class="add-btn">
              ＋ Добавить группу
            </button>
          </div>

          <div class="items-grid">
            <div v-for="group in groups" :key="group.id" class="item-card">
              <div class="item-icon">🎓</div>
              <div class="item-content">
                <h3>{{ group.name }}</h3>
                <p class="item-meta">Создана: {{ formatDate(group.createdAt) }}</p>
                <p class="item-stats">
                  Студентов: {{ getUsersInGroup(group.name).length }}
                </p>
              </div>
              <div class="item-actions">
                <button @click="deleteGroup(group.id)" class="action-btn delete" title="Удалить группу">
                  🗑️
                </button>
              </div>
            </div>

            <div v-if="groups.length === 0" class="empty-state">
              <p>Группы не добавлены</p>
            </div>
          </div>

          <!-- Add Group Modal -->
          <div v-if="showAddGroupModal" class="modal-overlay" @click.self="showAddGroupModal = false">
            <div class="modal">
              <div class="modal-header">
                <h3>Добавить группу</h3>
                <button @click="showAddGroupModal = false" class="modal-close">×</button>
              </div>
              <form @submit.prevent="addGroup" class="modal-form">
                <div class="form-group">
                  <label>Название группы:</label>
                  <input v-model="newGroup" placeholder="Например: Д-3.1" required class="form-input" />
                </div>
                <div class="form-actions">
                  <button type="button" @click="showAddGroupModal = false" class="btn btn-secondary">Отмена</button>
                  <button type="submit" class="btn btn-primary">Добавить</button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <!-- Specialties Management -->
        <div v-else-if="activeTab === 'specialties'" class="specialties-management">
          <div class="page-header">
            <h2>Управление специальностями</h2>
            <button @click="showAddSpecialtyModal = true" class="add-btn">
              ＋ Добавить специальность
            </button>
          </div>

          <div class="items-grid">
            <div v-for="specialty in specialties" :key="specialty.id" class="item-card">
              <div class="item-icon">📚</div>
              <div class="item-content">
                <h3>{{ specialty.name }}</h3>
                <p class="item-meta">Создана: {{ formatDate(specialty.createdAt) }}</p>
              </div>
              <div class="item-actions">
                <button @click="deleteSpecialty(specialty.id)" class="action-btn delete" title="Удалить специальность">
                  🗑️
                </button>
              </div>
            </div>

            <div v-if="specialties.length === 0" class="empty-state">
              <p>Специальности не добавлены</p>
            </div>
          </div>

          <!-- Add Specialty Modal -->
          <div v-if="showAddSpecialtyModal" class="modal-overlay" @click.self="showAddSpecialtyModal = false">
            <div class="modal">
              <div class="modal-header">
                <h3>Добавить специальность</h3>
                <button @click="showAddSpecialtyModal = false" class="modal-close">×</button>
              </div>
              <form @submit.prevent="addSpecialty" class="modal-form">
                <div class="form-group">
                  <label>Название специальности:</label>
                  <input v-model="newSpecialty" placeholder="Например: Дизайн интерьера" required class="form-input" />
                </div>
                <div class="form-actions">
                  <button type="button" @click="showAddSpecialtyModal = false" class="btn btn-secondary">Отмена</button>
                  <button type="submit" class="btn btn-primary">Добавить</button>
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
          </div>

          <div class="projects-grid">
            <div v-for="project in filteredProjects" :key="project.id" class="project-card">
              <div class="project-image">
                <img v-if="project.images && project.images[0]" :src="project.images[0]" :alt="project.title" />
                <div v-else class="project-image-placeholder">📁</div>
              </div>
              <div class="project-info">
                <h3>{{ project.title }}</h3>
                <p class="project-type">{{ project.type }}</p>
                <p class="project-author">Автор: {{ project.authorName }}</p>
                <div class="project-stats">
                  <span>👁️ {{ project.views || 0 }}</span>
                  <span>⭐ {{ project.rating || 0 }}</span>
                </div>
              </div>
              <div class="project-actions">
                <button @click="editProject(project)" class="action-btn edit" title="Редактировать">
                  ✏️
                </button>
                <button @click="deleteProject(project.id)" class="action-btn delete" title="Удалить">
                  🗑️
                </button>
              </div>
            </div>

            <div v-if="filteredProjects.length === 0" class="empty-state">
              <p>Проекты не найдены</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-panel {
  min-height: 100vh;
  background: #f5f7fa;
}

.simple-header {
  background: #2c3e50;
  color: white;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.simple-header h1 {
  margin: 0;
  font-size: 1.5rem;
}

.logout-btn {
  background: #e74c3c;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s;
}

.logout-btn:hover {
  background: #c0392b;
}

.admin-container {
  display: flex;
  min-height: calc(100vh - 80px);
}

.admin-sidebar {
  width: 280px;
  background: white;
  border-right: 1px solid #e1e8ed;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 1rem;
  border: none;
  background: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  text-align: left;
}

.nav-item:hover {
  background: #f8f9fa;
}

.nav-item.active {
  background: #3498db;
  color: white;
}

.nav-icon {
  font-size: 1.2rem;
  margin-right: 0.75rem;
}

.nav-text {
  font-weight: 500;
}

.sidebar-stats {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e1e8ed;
}

.sidebar-stats h3 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  color: #6c757d;
}

.stat-item {
  display: flex;
  align-items: center;
  padding: 0.5rem 0;
  font-size: 0.9rem;
}

.stat-icon {
  margin-right: 0.5rem;
  font-size: 1.1rem;
}

.admin-content {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.page-header h2 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.8rem;
}

.add-btn {
  background: #27ae60;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.3s;
}

.add-btn:hover {
  background: #229954;
}

.filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.search-input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
}

.filter-select {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  min-width: 150px;
}

.table-container {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.users-table {
  width: 100%;
  border-collapse: collapse;
}

.users-table th {
  background: #f8f9fa;
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #495057;
  border-bottom: 2px solid #e9ecef;
}

.users-table td {
  padding: 1rem;
  border-bottom: 1px solid #e9ecef;
}

.user-name {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #3498db;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.9rem;
}

.role-select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-badge.active {
  background: #d4edda;
  color: #155724;
}

.status-badge.inactive {
  background: #f8d7da;
  color: #721c24;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  padding: 0.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s;
}

.action-btn.edit {
  background: #fff3cd;
}

.action-btn.edit:hover {
  background: #ffeaa7;
}

.action-btn.delete {
  background: #f8d7da;
}

.action-btn.delete:hover {
  background: #f5c6cb;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #6c757d;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
}

.modal-header h3 {
  margin: 0;
  color: #2c3e50;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6c757d;
}

.modal-form {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #495057;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
}

.form-select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  font-size: 1rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover {
  background: #2980b9;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.item-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.item-icon {
  font-size: 2rem;
}

.item-content {
  flex: 1;
}

.item-content h3 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
}

.item-meta {
  margin: 0;
  color: #6c757d;
  font-size: 0.9rem;
}

.item-stats {
  margin: 0.5rem 0 0 0;
  color: #3498db;
  font-size: 0.9rem;
  font-weight: 500;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.project-card {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.project-image {
  height: 200px;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
}

.project-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.project-image-placeholder {
  font-size: 3rem;
  color: #6c757d;
}

.project-info {
  padding: 1.5rem;
}

.project-info h3 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
}

.project-type {
  margin: 0 0 0.5rem 0;
  color: #6c757d;
  font-size: 0.9rem;
}

.project-author {
  margin: 0 0 1rem 0;
  color: #495057;
}

.project-stats {
  display: flex;
  gap: 1rem;
  color: #6c757d;
  font-size: 0.9rem;
}

.project-actions {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e9ecef;
  display: flex;
  gap: 0.5rem;
}

@media (max-width: 768px) {
  .admin-container {
    flex-direction: column;
  }

  .admin-sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #e1e8ed;
  }

  .filters {
    flex-direction: column;
  }

  .items-grid,
  .projects-grid {
    grid-template-columns: 1fr;
  }

  .modal {
    width: 95%;
    margin: 1rem;
  }
}
</style>