<template>
  <div class="chat-list" ref="listRef">
    <div v-if="hasNext" class="text-center q-mb-md">
      <BaseButton
        :loading="isLoadingPreviousMessages"
        color="grey"
        size="sm"
        class="q-mx-auto"
        text-color="white"
        @click="onClickLoadMore"
        >지난 채팅 불러오기</BaseButton
      >
    </div>
    <div
      v-for="(item, index) in groupedMessages"
      :key="item.id ?? index"
      :data-id="item.id"
      class="chat-list__group">
      <!-- 날짜 -->
      <div v-if="item.ui.showDate" class="chat-list__time">
        <span>
          <q-icon name="calendar_today" class="q-mr-xs" />
          {{ formatDate(item.time) }}
        </span>
      </div>
      <!-- 메시지 -->
      <ChatMessageItem :message="item" />
    </div>
  </div>
</template>
<script setup lang="ts">
// ===================================================
// 📦 Imports
// ===================================================
import { storeToRefs } from 'pinia'
import { ref, computed, watch, nextTick } from 'vue'
import { useChatStore } from '@/stores/chat'
import { QIcon } from 'quasar'
import dayjs from '@/libs/dayjs.ts'
import ChatMessageItem from './ChatMessage.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import type { ChatMessage } from '@/types/components/chat.ts'
const chatStore = useChatStore()
// ===================================================
// 📥 Props / Emits
// ===================================================
const emit = defineEmits<{
  (e: 'load-more'): void
  (e: 'select-question', data: string): void
}>()

// ===================================================
// 📦 State
// ===================================================
const { hasNext, isLoadingPreviousMessages } = storeToRefs(chatStore)
const listRef = ref<HTMLElement | null>(null)
let prevHeight: number | null = null

// ===================================================
// 🧮 Computed
// ===================================================
const groupedMessages = computed(() => {
  return chatStore.messages.map((msg, idx) => {
    const current = dayjs(msg.time)
    const prev = chatStore.messages[idx - 1]
    const prevDate = prev ? dayjs(prev.time) : null

    return {
      ...msg,
      ui: {
        showDate: !prevDate || !current.isSame(prevDate, 'day'),
      },
    }
  })
})

// ===================================================
// ⚙️ Methods
// ===================================================
const formatDate = (time?: Date | null) => {
  return dayjs(time).format('YYYY년 M월 DD일')
}
const getEl = () => listRef.value as HTMLElement

const isNearBottom = () => {
  const el = getEl()
  if (!el) return false

  const threshold = 80
  return el.scrollHeight - el.scrollTop - el.clientHeight < threshold
}

const scrollToBottom = async (smooth = false) => {
  const el = getEl()
  if (!el) return
  await nextTick()
  await waitFrames(6)

  el.scrollTo({
    top: el.scrollHeight,
    behavior: smooth ? 'smooth' : 'auto',
  })
}
const waitFrames = (count = 2) => {
  return new Promise<void>((resolve) => {
    const run = (left: number) => {
      if (left <= 0) {
        resolve()
        return
      }

      requestAnimationFrame(() => run(left - 1))
    }

    run(count)
  })
}
// ===================================================
// 🛠️ Actions
// ===================================================
const onClickLoadMore = async () => {
  if (isLoadingPreviousMessages.value) return
  chatStore.loadPreviousMessages()
  emit('load-more')
}
// ===================================================
// 👀 Watchers
// ===================================================
watch(
  () => isLoadingPreviousMessages.value,
  (val) => {
    if (val) {
      if (prevHeight == null) {
        const el = getEl()
        if (!el) return
        prevHeight = el.scrollHeight
      }
    }
  },
)

watch(
  () => chatStore.messages.length,
  async (newLen, oldLen) => {
    if (newLen <= oldLen) return
    if (isLoadingPreviousMessages.value) {
      await nextTick()
      const el = getEl()
      if (!el) return
      const newHeight = el.scrollHeight
      el.scrollTop = newHeight - (prevHeight ?? 0)
      prevHeight = null
      return
    }
    const shouldScroll = isNearBottom()
    await nextTick()
    await waitFrames(2)
    if (shouldScroll) {
      void scrollToBottom(false)
    }
  },
)

watch(
  () =>
    chatStore.messages
      .filter((m: ChatMessage) => m.status !== 'done')
      .map((m: ChatMessage) => m.text),
  async (newVal, oldVal) => {
    if (!newVal.length && oldVal.length) {
      // 메타정보까지 수신 완료 시
      await nextTick()
      void scrollToBottom(false)
    }
    if (!newVal.length) return
    if (isLoadingPreviousMessages.value || isNearBottom()) return
    await nextTick()
    void scrollToBottom(false)
  },
)
</script>
<style lang="scss" scoped>
.chat-list {
  padding: 12px;
  overflow: auto;
  &__time {
    display: flex;
    justify-content: center;
    margin-bottom: 16px;
    position: relative;
    &::after {
      content: '';
      position: absolute;
      top: 50%;
      width: 100%;
      height: 1px;
      background: var(--color-border);
    }
    span {
      z-index: 1;
      background: var(--color-surface);
      padding: 0 8px;
    }
  }
}
</style>
