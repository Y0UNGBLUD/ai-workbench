// chat stream event
interface ContentData {
  content: string | null
}

export interface ProgressEvent {
  event: 'progress'
  data: ContentData
}

export interface TokenEvent {
  event: 'token'
  data: ContentData
}

export interface ErrorEvent {
  event: 'error'
  data: ContentData
}

export interface EndEvent {
  event: 'end'
  data: ContentData & {
    links: string[]
  }
}

export type ChatStreamEvent = ProgressEvent | TokenEvent | ErrorEvent | EndEvent

export function isEvent<T extends ChatStreamEvent['event']>(
  payload: ChatStreamEvent,
  type: T,
): payload is Extract<ChatStreamEvent, { event: T }> {
  return payload.event === type
}
