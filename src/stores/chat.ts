import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { generateRandomId } from '@/utils/string'
import type { ChatMessage, ChatUiOptions } from '@/types/components/chat'
import { isEvent, type ChatStreamEvent } from '@/types/models/realtime.model'
export const useChatStore = defineStore('chat', () => {
  // ===================================================
  // 📦 State
  // ===================================================
  const messages = ref<ChatMessage[]>([])
  const isLoadedHistory = ref(false)
  const hasNext = ref(false)
  // chat status
  const isLoadingPreviousMessages = ref(false)
  const isPendingChat = ref(false)
  // ui status
  const createDefaultUIOptions = (): ChatUiOptions => ({
    useChatAction: true,
    defaultPlaceholder: '메시지를 입력하세요.',
    invalidPlaceholder: '채팅을 이용할 수 없습니다.',
    isInvalidPlaceholder: () => false,
  })
  const uiOptions = ref<ChatUiOptions>(createDefaultUIOptions())

  // ===================================================
  // 🧮 Computed
  // ===================================================
  const isChatBusy = computed(() => {
    return isPendingChat.value
  })
  const isDisableForm = computed(() => {
    return isPendingChat.value
  })

  // ===================================================
  // ⚙️ Methods
  // ===================================================
  function setMessages(nextMessages: ChatMessage[]) {
    messages.value = nextMessages
  }

  function addMessage(message: ChatMessage) {
    messages.value.push(message)
  }

  function updateMessage(id: string, patch: Partial<ChatMessage>) {
    const target = messages.value.find((message) => message.id === id)
    if (!target) return

    Object.assign(target, patch)
  }

  function resetMessages() {
    messages.value = []
  }

  function setUIOptions(options: Partial<ChatUiOptions>) {
    uiOptions.value = {
      ...uiOptions.value,
      ...options,
    }
  }
  function resetUIOptions() {
    uiOptions.value = createDefaultUIOptions()
  }
  function setHasNext(val: boolean) {
    hasNext.value = val
  }
  function resetChatState(resetUiOpt = false) {
    resetMessages()
    isLoadedHistory.value = false
    hasNext.value = false
    isLoadingPreviousMessages.value = false
    isPendingChat.value = false

    if (resetUiOpt) resetUIOptions()
  }

  // ===================================================
  // 🛠️ Actions
  // ===================================================
  /**
   * 메시지 전송
   */
  function sendChat(msg: string) {
    // 유저 메시지
    const userMsg: ChatMessage = {
      id: generateRandomId(),
      sender: 'user',
      type: 'out',
      text: msg,
      time: new Date(),
      status: 'done',
    }

    addMessage(userMsg)

    // Ai 메시지
    const aiMsg: ChatMessage = {
      id: generateRandomId(),
      sender: 'ai',
      type: 'in',
      text: '',
      time: new Date(),
      status: 'pending',
      meta: [],
    }

    addMessage(aiMsg)
    isPendingChat.value = true
  }
  /**
   * 메시지 수신 처리
   */
  function receiveChat(payload: ChatStreamEvent) {
    const aiMsg = [...messages.value]
      .reverse()
      .find((msg) => msg.sender === 'ai' && msg.status !== 'done')

    if (!aiMsg) return
    // 종료 신호 처리
    if (isEvent(payload, 'end')) {
      aiMsg.status = 'done'
      isPendingChat.value = false
      return
    }

    // 스트리밍 수신
    if (isEvent(payload, 'token')) {
      aiMsg.status = 'typing'
      aiMsg.text += payload?.data?.content ?? ''
    }
    // 에러
    if (isEvent(payload, 'error')) {
      aiMsg.status = 'error'
      aiMsg.error = payload?.data?.content ?? '오류가 발생했습니다.'
      isPendingChat.value = false
    }
  }
  /**
   * 채팅내역 조회 처리
   */
  function setChatHistory(payload: ChatMessage[]) {
    // 기존 메시지 앞에 추가
    messages.value = [...payload, ...messages.value]
    isLoadedHistory.value = true
    isLoadingPreviousMessages.value = false
  }
  /**
   * 채팅 내역 더 불러오기
   */
  function loadPreviousMessages() {
    isLoadingPreviousMessages.value = true
  }
  // ===================================================
  // 😊 Return
  // ===================================================
  return {
    messages,
    isLoadedHistory,
    hasNext,
    isLoadingPreviousMessages,
    isPendingChat,
    uiOptions,
    isChatBusy,
    isDisableForm,
    // method
    setMessages,
    addMessage,
    updateMessage,
    resetMessages,
    setUIOptions,
    setHasNext,
    resetChatState,
    // actions
    loadPreviousMessages,
    sendChat,
    receiveChat,
    setChatHistory,
  }
})
