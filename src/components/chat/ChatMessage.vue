<template>
  <div class="chat-message" :class="[`chat-message--${message.type}`]">
    <div v-if="message.status == 'pending'" class="chat-message__pending">
      <q-spinner class="chat-message__pending-spinner" />
      <span class="chat-message__pending-text">응답 대기 중...</span>
    </div>
    <template v-else>
      <div
        v-if="message.type == 'in'"
        v-html="htmlContent"
        class="chat-message__content chat-message__markdown"></div>
      <p v-else class="chat-message__content">{{ message.text }}</p>
      <div
        v-if="chatStore.uiOptions.useChatAction"
        class="chat-message__actions">
        <span class="chat-message__time">
          {{ dayjs(message.time).format('h:mm A') }}
        </span>
        <BaseButton
          label="복사"
          a11y
          icon="content_copy"
          color="transparent"
          round
          size="xs"
          class="chat-message__action chat-message__action--copy"
          @click="copyText" />
      </div>
    </template>
  </div>
</template>
<script setup lang="ts">
// ===================================================
// 📦 Imports
// ===================================================
import { ref, watch } from 'vue'
import { QSpinner } from 'quasar'
import type { ChatMessage } from '@/types/components/chat'
import { parseMarkdown } from '@/libs/markdown'
import BaseButton from '@/components/common/BaseButton.vue'
import dayjs from '@/libs/dayjs'
import { notify } from '@/libs/notify'
import { useChatStore } from '@/stores/chat'
const chatStore = useChatStore()
// ===================================================
// 📥 Props / Emits
// ===================================================
const props = defineProps<{
  message: ChatMessage
}>()

// ===================================================
// 📦 State
// ===================================================
const htmlContent = ref('')
const notifyContent = {
  positive: {
    type: 'positive',
    message: '복사 완료',
    caption: '클립보드에 내용이 저장되었습니다.',
  },
  negative: {
    type: 'negative',
    message: '복사 실패',
    caption: '클립보드에 접근할 수 없습니다.',
  },
}
// ===================================================
// ⚙️ Methods
// ===================================================
const copyText = async () => {
  const text = props.message.text
  if (navigator.clipboard && window.isSecureContext) {
    // 최신 브라우저
    try {
      await navigator.clipboard.writeText(text)
      notify(notifyContent.positive)
      return true
    } catch (err) {
      console.error('Clipboard API 실패', err)
      notify(notifyContent.negative)
      return false
    }
  } else {
    // 구형 브라우저
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()

    try {
      const success = document.execCommand('copy')
      document.body.removeChild(textarea)
      notify(notifyContent.positive)
      return success
    } catch (err) {
      console.error('execCommand 실패', err)
      document.body.removeChild(textarea)
      notify(notifyContent.negative)
      return false
    }
  }
}

// ===================================================
// 👀 Watchers
// ===================================================
watch(
  () => props.message.text,
  async (content) => {
    if (props.message.type !== 'in') {
      htmlContent.value = ''
      return
    }

    htmlContent.value = await parseMarkdown(content || '')
  },
  { immediate: true },
)
</script>
<style lang="scss" scoped>
.chat-message {
  display: flex;
  flex-direction: column;
  &--in {
    margin-bottom: 32px;
  }
  &--out {
    align-items: end;
    text-align: right;
    margin-bottom: 12px;
    font-weight: 500;
    .chat-message__content {
      background: rgb(from var(--color-secondary) r g b / 30%);
      padding: 8px 16px;
      border-radius: 4px;
    }
  }
  // pending
  &__pending {
    display: flex;
    align-items: center;
    color: var(--color-text-secondary);
  }
  &__pending-spinner {
    margin-right: 8px;
  }
  // content
  &__content {
    font-size: mixin.rem(16px);
    word-break: break-all;
  }
  &__markdown:deep() {
    h1,
    h2,
    h3,
    h4,
    h5,
    h6 {
      color: var(--color-text-primary);
      font-weight: 700;
      margin: 8px 0;
    }
    h1 {
      font-size: mixin.rem(21px);
      line-height: mixin.rem(24px);
    }
    h2 {
      font-size: mixin.rem(20px);
      line-height: mixin.rem(23px);
    }
    h3 {
      font-size: mixin.rem(19px);
      line-height: mixin.rem(22px);
    }
    h4 {
      font-size: mixin.rem(18px);
      line-height: mixin.rem(21px);
    }
    h5 {
      font-size: mixin.rem(17px);
      line-height: mixin.rem(20px);
    }
    h6 {
      font-size: mixin.rem(16px);
      line-height: mixin.rem(18px);
    }

    ul {
      list-style: disc;
    }
    ol {
      list-style: decimal;
    }
    ul,
    ol {
      margin-block-start: 0.5em;
      margin-block-end: 0.5em;
      padding-inline-start: 16px;
      white-space: normal;
      list-style-position: inside;
      > li > p:first-of-type {
        display: inline;
      }
    }
    li + li {
      margin-top: 8px;
    }
    p {
      font-size: inherit;
      font-weight: inherit;
      color: inherit;
      line-height: inherit;
      white-space: pre-line;
    }
    > p ~ p {
      margin-top: 8px;
    }
    hr {
      border-style: solid;
      border-color: var(--color-border);
      margin: 16px 0;
    }
    strong {
      color: var(--color-text-primary);
      font-weight: 700;
    }
    pre {
      background: var(--gray-800);
      color: var(--gray-50);
      padding: 12px;
      border-radius: 4px;
      overflow: auto;
      > code {
        padding: 0;
        margin: 0;
        background: inherit;
        color: inherit;
      }
    }
    code {
      background: var(--gray-800);
      color: var(--gray-50);
      padding: 4px;
      border-radius: 4px;
      font-size: mixin.rem(13px);
      line-height: mixin.rem(16px);
      margin: 0 2px;
    }
    table {
      width: 100%;
      border: 1px solid var(--color-border);
      border-collapse: collapse;
      table-layout: auto;
      thead {
        th {
          background: var(--color-border);
          height: 40px;
          padding: 4px;
          &:not(:last-child) {
            border-right: 1px solid var(--color-border);
          }
        }
      }
      tbody {
        td {
          height: 48px;
          padding: 4px;
          word-break: keep-all;
          &:not(:last-child) {
            border-right: 1px solid var(--color-border);
          }
        }
        tr:not(:last-child) {
          td {
            border-bottom: 1px solid var(--color-border);
          }
        }
      }
    }
    blockquote {
      margin: 12px;
      border-left: 8px solid var(--color-border);
      padding: 12px 16px;
      background: var(--color-background);
      color: var(--color-text-secondary);
      font-size: mixin.rem(14px);
      line-height: mixin.rem(18px);
      * {
        color: inherit;
      }
    }
  }
  // actions
  &__actions {
    margin-top: 4px;
    display: flex;
    align-items: center;
  }
  &__time {
    color: var(--color-text-secondary);
  }
  &__action {
    margin-left: 4px;
  }
}
</style>
