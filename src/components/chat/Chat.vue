<template>
  <div class="chat">
    <ChatMessageList />
    <ChatInput @send="sendChat" />
  </div>
</template>
<script setup lang="ts">
// ===================================================
// 📦 Imports
// ===================================================
import ChatMessageList from './ChatMessageList.vue'
import ChatInput from './ChatInput.vue'

// ===================================================
// 📥 Props / Emits
// ===================================================
const emit = defineEmits<{
  (e: 'send', msg: string): void
  (e: 'load-more'): void
}>()

const sendChat = (msg: string) => {
  emit('send', msg)
}
</script>
<style lang="scss" scoped>
.chat {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  .chat-list {
    flex-grow: 1;
    min-height: 0;
  }
  .chat-input {
    margin-top: auto;
  }
}
</style>
