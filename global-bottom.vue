<script setup lang="ts">
import { computed } from 'vue'
import { useNav } from '@slidev/client'

const { currentLayout, currentPage, total } = useNav()
const dark = computed(() => ['cover', 'section'].includes(currentLayout.value))
</script>

<template>
  <footer v-if="currentLayout !== 'cover'" class="otel-footer" :class="{ 'otel-footer--dark': dark }">
    <img src="/otel-icon.svg" alt="" class="h-5">
    <span>Context Propagation</span>
    <span class="ml-auto tabular-nums">{{ currentPage }} / {{ total }}</span>
  </footer>
</template>
