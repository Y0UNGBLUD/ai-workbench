// status
export type MessageStatus = 'pending' | 'typing' | 'done' | 'error'
export type MessageMetaStatus = 'idle' | 'loading' | 'done' | 'error'
export interface ChatUiOptions {
  useChatAction?: boolean
  defaultPlaceholder?: string
  invalidPlaceholder?: string
  isInvalidPlaceholder?: () => boolean
}

// map
export type ChatMetaMap = {
  questions: string[]
  link: string
}

export type ChatMeta = {
  [K in keyof ChatMetaMap]: {
    type: K
    data: ChatMetaMap[K]
  }
}[keyof ChatMetaMap]

//
export type ChatMessage = {
  id: string
  sender: 'user' | 'ai'
  type: 'in' | 'out'
  text: string
  time?: Date | null
  status: MessageStatus
  meta?: ChatMeta[]
  error?: string | null
}
