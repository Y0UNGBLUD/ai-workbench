<template>
  <FormInput v-model="modelValue" v-bind="$attrs" @enter="handleEnter">
    <template #prepend>
      <q-icon name="search" />
    </template>
  </FormInput>
</template>
<script setup lang="ts">
import { QIcon } from 'quasar'
import FormInput from './FormInput.vue'
const modelValue = defineModel<string>({
  required: true,
})

const emit = defineEmits<{
  (e: 'enter'): void
}>()

const handleEnter = () => {
  emit('enter')
}
</script>
