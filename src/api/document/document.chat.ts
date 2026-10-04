import { api } from '@/libs/axios'
import { createFetchStream } from '@/utils/realtime/fetch'
import { consumeSseStream } from '@/utils/realtime/sse'
import type { ChatStreamEvent } from '@/types/models/realtime.model'
import type {
  DocumentChatRequest,
  DocumentChatHistoryRequest,
} from '@/types/api/document.request'
import type { DocumentChatHistoryResponse } from '@/types/api/document.response'

/**
 * 채팅 내역 조회
 */
export async function loadDocumentChatHistory(
  params: DocumentChatHistoryRequest,
) {
  return await api.get<DocumentChatHistoryResponse>(
    `/api/v1/document/chat/list`,
    {
      params: {
        ...params,
      },
    },
  )
}

/**
 * 채팅 전송
 */
export async function sendDocumentChat(
  params: DocumentChatRequest,
  onEvent: (data: ChatStreamEvent) => void,
) {
  const fetchStream = createFetchStream()
  const controller = new AbortController()
  const res = await fetchStream(`/api/v1/document/chat/send`, {
    method: 'POST',
    body: JSON.stringify(params),
    signal: controller.signal,
  })

  await consumeSseStream(res, onEvent, controller)
}
