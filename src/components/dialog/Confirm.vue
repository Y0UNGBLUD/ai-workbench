<template>
  <q-dialog
    v-model="visible"
    :persistent="loading || persistent"
    class="base-dialog base-dialog--confirm"
    @show="$emit('open')"
    @hide="$emit('close')"
    v-bind="$attrs">
    <q-card class="base-dialog__card">
      <q-card-section
        class="base-dialog__header"
        :class="{ 'has-title': hasTitle }">
        <h5 v-if="title" class="base-dialog__title">
          <span class="base-dialog__title-text">{{ title }}</span>
        </h5>
      </q-card-section>
      <q-card-section class="base-dialog__content">
        <slot></slot>
      </q-card-section>
      <q-card-section class="base-dialog__footer">
        <BaseButton
          :label="cancelLabel ? cancelLabel : '취소'"
          :disable="!!loading"
          @click="onClickCancel"
          color="gray"
          class="base-dialog__footer-btn base-dialog__footer-btn--cancel" />
        <BaseButton
          :label="confirmLabel ? confirmLabel : '확인'"
          :loading="!!loading"
          color="primary"
          @click="onClickConfirm"
          class="base-dialog__footer-btn base-dialog__footer-btn--confirm" />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>
<script setup lang="ts">
// ===================================================
// 📦 Imports
// ===================================================
import { computed } from 'vue'
import { QDialog, QCard, QCardSection } from 'quasar'
import BaseButton from '@/components/common/BaseButton.vue'

// ===================================================
// 📥 Props / Emits
// ===================================================
const props = withDefaults(
  defineProps<{
    title?: string
    confirmLabel?: string
    cancelLabel?: string
    loading?: boolean
    persistent?: boolean
    closeOnConfirm?: boolean
    closeOnCancel?: boolean
  }>(),
  {
    confirmLabel: '확인',
    cancelLabel: '취소',
    loading: false,
    closeOnConfirm: true,
    closeOnCancel: true,
  },
)
const emit = defineEmits<{
  (e: 'open'): void
  (e: 'cancel'): void
  (e: 'confirm'): void
  (e: 'close'): void
}>()
// ===================================================
// 📦 State
// ===================================================
const rawVisible = defineModel<boolean | undefined>({
  default: false,
})
const visible = computed({
  get: () => rawVisible.value ?? false,
  set: (v: boolean) => (rawVisible.value = v),
})
const hasTitle = computed(() => {
  return props.title !== null && props.title !== undefined
})
// ===================================================
// ⚙️ Methods
// ===================================================
const onClickCancel = () => {
  emit('cancel')
  if (props.closeOnCancel) rawVisible.value = false
}
const onClickConfirm = () => {
  emit('confirm')
  if (props.closeOnConfirm) rawVisible.value = false
}
</script>
