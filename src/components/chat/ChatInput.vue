<template>
  <div class="chat-input">
    <FormTextarea
      v-model="text"
      :enter-to-send="true"
      :disable="chatStore.isPendingChat"
      :placeholder="formPlaceholder"
      hide-bottom
      @enter="sendMessage"
      class="chat-input__textarea" />
    <BaseButton
      icon="send"
      :disable="chatStore.isDisableForm"
      dense
      @click="sendMessage"
      class="chat-input__btn" />
  </div>
</template>
<script setup lang="ts">
// ===================================================
// 📦 Imports
// ===================================================
import { ref, computed } from 'vue'
import BaseButton from '@/components/common/BaseButton.vue'
import FormTextarea from '@/components/form/FormTextarea.vue'
import { useChatStore } from '@/stores/chat'

// ===================================================
// 📥 Props / Emits
// ===================================================
const emit = defineEmits<{
  (e: 'send', msg: string): void
}>()

// ===================================================
// 📦 State
// ===================================================
const chatStore = useChatStore()
const text = ref('')
const formPlaceholder = computed(() => {
  return chatStore.uiOptions.isInvalidPlaceholder
    ? chatStore.uiOptions.defaultPlaceholder
    : chatStore.uiOptions.invalidPlaceholder
})
// ===================================================
// ⚙️ Methods
// ===================================================
const sendMessage = () => {
  if (!text.value.trim() || chatStore.isDisableForm) return
  emit('send', text.value)
  text.value = ''
}
</script>
<style lang="scss" scoped>
.chat-input {
  display: flex;
  align-items: stretch;
  width: 100%;
  &__textarea {
    flex-grow: 1;
  }
  &__btn {
  }
}
</style>
