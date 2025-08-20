<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  project: {
    type: Object,
    required: true
  }
})

const averageRating = computed(() => {
  if (!props.project.reviews || props.project.reviews.length === 0) return 0
  const sum = props.project.reviews.reduce((acc: number, review: any) => acc + review.rating, 0)
  return (sum / props.project.reviews.length).toFixed(1)
})
</script>

<template>
  <div class="project-card">
    <div class="project-image">
      <img v-if="project.images && project.images.length" :src="project.images[0]" :alt="project.title">
      <div v-else class="image-placeholder">Изображение отсутствует</div>
    </div>
    <div class="project-info">
      <h3>{{ project.title || 'Без названия' }}</h3>
      <p><strong>Автор:</strong> {{ project.author || 'Неизвестен' }}</p>
      <p><strong>Группа:</strong> {{ project.group || 'Не указана' }}</p>
      <p><strong>Специальность:</strong> {{ project.specialty || 'Не указана' }}</p>
      <p v-if="project.type"><strong>Тип проекта:</strong> {{ project.type }}</p>
      <div class="rating" v-if="project.reviews && project.reviews.length > 0">
        <span v-for="i in 5" :key="i" class="star" :class="{ filled: i <= averageRating }">
          ★
        </span>
        <span class="rating-value">({{ averageRating }})</span>
      </div>
      <div class="rating" v-else>
        <span class="no-reviews">Нет отзывов</span>
      </div>
    </div>
  </div>
</template>
<style scoped lang="scss">
@import "./projectCard.scss";
</style>