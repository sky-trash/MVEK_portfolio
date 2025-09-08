<script setup lang="ts">
defineProps({
  isVisible: Boolean,
  title: String,
  message: String,
  showBackButton: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:isVisible', 'back']);

const close = () => {
  emit('update:isVisible', false);
};
</script>

<template>
  <div v-if="isVisible" class="modal-overlay" @click.self="close">
    <div class="modal-container">
      <div class="modal-header">
        <h3>{{ title }}</h3>
        <button @click="close" class="modal-close">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="modal-body">
        <p>{{ message }}</p>
      </div>
      <div class="modal-footer">
        <button @click="close" class="modal-button modal-button-primary">
          Понятно
        </button>
        <button v-if="showBackButton" @click="$emit('back')" class="modal-button">
          <i class="fas fa-arrow-left"></i> Назад
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container {
  background: white;
  border-radius: 12px;
  padding: 0;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  color: #1f2937;
  font-size: 18px;
  font-weight: 600;
}

.modal-close {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #6b7280;
  padding: 4px;
}

.modal-close:hover {
  color: #374151;
}

.modal-body {
  padding: 24px;
}

.modal-body p {
  margin: 0;
  color: #4b5563;
  line-height: 1.5;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.modal-button {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.modal-button-primary {
  background-color: #3b82f6;
  color: white;
}

.modal-button-primary:hover {
  background-color: #2563eb;
}

.modal-button {
  background-color: #f3f4f6;
  color: #374151;
}

.modal-button:hover {
  background-color: #e5e7eb;
}
</style>