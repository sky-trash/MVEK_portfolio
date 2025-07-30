<script setup lang="ts">
defineProps<{
  project: {
    id: string
    title: string
    previewImage: string
    type: string
    rating: number
  }
}>()

defineEmits(['click'])
</script>

<template>
  <div class="project-card" @click="$emit('click')">
    <div class="project-image-container">
      <img :src="project.previewImage || '/default-project.jpg'" :alt="project.title" class="project-image">
      <div class="project-type">{{ project.type }}</div>
    </div>
    <div class="project-info">
      <h3 class="project-title">{{ project.title }}</h3>
      <div class="project-meta">
        <div class="project-rating">
          <span class="rating-stars">
            <span v-for="n in 5" :key="n" :class="['star', { 'filled': n <= Math.round(project.rating) }]">★</span>
          </span>
          <span class="rating-value">{{ project.rating.toFixed(1) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import "./projectCard.scss";
</style>