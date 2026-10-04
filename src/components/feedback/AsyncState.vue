<template>
  <div class="async-state">
    <Transition name="fade" mode="out-in">
      <div v-if="loading" class="async-state__loading" :class="loadingClasses">
        <slot name="skeleton"></slot>
      </div>
      <div
        v-else-if="hasError"
        class="async-state__error"
        :class="errorClasses">
        <slot name="error" :error="error"></slot>
      </div>
      <div v-else-if="empty" class="async-state__empty" :class="emptyClasses">
        <slot name="empty"></slot>
      </div>
      <div v-else class="async-state__content" :class="contentClasses">
        <slot></slot>
      </div>
    </Transition>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'
interface Props {
  loading?: boolean
  error?: unknown
  empty?: boolean
  loadingClasses?: string
  errorClasses?: string
  contentClasses?: string
  emptyClasses?: string
}

const props = defineProps<Props>()

const hasError = computed(() => {
  const error = props.error
  if (Array.isArray(error)) {
    return error.some(Boolean)
  }
  if (error instanceof Error) {
    return true
  }
  if (error && typeof error === 'object') {
    return Object.values(error).some(Boolean)
  }
  return !!error
})
</script>
<style lang="scss" scoped>
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(4px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
