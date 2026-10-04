<template>
  <div
    class="empty-state"
    :class="{ outline: outline }"
    :style="{
      paddingTop: `${padding}px`,
      paddingBottom: `${padding}px`,
    }">
    <span class="empty-state__text" v-if="text">{{ text }}</span>
  </div>
</template>
<script setup lang="ts">
withDefaults(
  defineProps<{
    text?: string
    padding?: number
    outline?: boolean
  }>(),
  {
    text: '표시할 내용이 없습니다.',
    padding: 100,
    outline: false,
  },
)
</script>
