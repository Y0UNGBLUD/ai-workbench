<template>
  <div class="base-pagination">
    <q-btn
      flat
      class="base-pagination__prev"
      :disable="!!disable"
      @click="prevPage">
      <q-icon name="chevron_left" size="16" />
    </q-btn>
    <q-pagination
      v-model="modelValue"
      @update:modelValue="
        (val) => {
          $emit('change', val)
        }
      "
      :max="max ? max : 1"
      :max-pages="maxPages ? maxPages : 1"
      :disable="!!disable"
      flat
      color="dark"
      active-color="primary"
      text-color="none"
      boundary-numbers
      class="base-pagination__item" />
    <q-btn
      flat
      class="base-pagination__next"
      :disable="!!disable"
      @click="nextPage">
      <q-icon name="chevron_right" size="16" />
    </q-btn>
  </div>
</template>
<script setup lang="ts">
import { QBtn, QIcon, QPagination } from 'quasar'

// ===================================================
// 📥 Props / Emits
// ===================================================
const props = withDefaults(
  defineProps<{
    max?: number | string
    maxPages?: number | string
    disable?: boolean | string
  }>(),
  {
    max: 1,
    maxPages: 6,
    disable: false,
  },
)
const emit = defineEmits<{
  (e: 'change', value: number): void
}>()

const modelValue = defineModel<number>({ default: 1 })

// ===================================================
// ⚙️ Methods
// ===================================================
function prevPage() {
  if (modelValue.value > 1) {
    modelValue.value--
    emit('change', modelValue.value)
  }
}

function nextPage() {
  const max = Number(props.max)

  if (modelValue.value < max) {
    modelValue.value++
    emit('change', modelValue.value)
  }
}
</script>
<style lang="scss" scoped>
.base-pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  :deep().q-pagination__content {
    .q-btn {
      border-radius: 0px;
      &::before {
        box-shadow: none;
      }
    }
  }
}
</style>
