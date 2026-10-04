<template>
  <div
    class="error-state"
    :style="{
      paddingTop: `${padding}px`,
      paddingBottom: `${padding}px`,
    }">
    <q-icon :name="icon ?? 'cloud'" size="md" class="error-state__icon" />
    <p
      class="error-state__text"
      :class="{ 'q-mb-none': !useRetryButton }"
      :style="{
        marginBottom: !useRetryButton ? 0 : '',
      }">
      {{ text ?? '데이터를 가져오지 못했습니다.' }}
    </p>
    <BaseButton
      v-if="useRetryButton"
      :label="buttonText ?? '다시 시도'"
      color="grey"
      class="error-state__button"
      @click="$emit('retry')" />
  </div>
</template>
<script setup lang="ts">
// ===================================================
// 📦 Imports
// ===================================================
import BaseButton from '@/components/common/BaseButton.vue'
import { QIcon } from 'quasar'

// ===================================================
// 📥 Props / Emits
// ===================================================
const props = withDefaults(
  defineProps<{
    icon?: string
    text?: string
    buttonText?: string
    padding?: number
    useRetryButton?: boolean
  }>(),
  {
    icon: 'cloud',
    padding: 100,
    useRetryButton: true,
  },
)
</script>
