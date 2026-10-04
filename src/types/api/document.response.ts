import type { PaginatedResponse } from '@/types/api/common'
import type {
  StoredDocument,
  DocumentDetail,
} from '@/types/models/document.model'
import type { ChatMessage } from '@/types/components/chat'

// 문서 목록 조회
export type DocumentListResponse = PaginatedResponse<StoredDocument>

// 문서 삭제 응답
export type DocumentDeleteResponse = {
  sucess: boolean
  message: string
}

// 문서 정보 상세 조회 응답
export type DocumentInfoResponse = StoredDocument

// 문서 분석 요청 응답
export type DocumentAnalysisResponse = DocumentDetail
export interface AnalysisSseChunk {
  event: string
  status: 'progress' | 'complete' | 'error'
  data: string | string[] | null
}

// 채팅 내역 조회 응답
export type DocumentChatHistoryResponse = PaginatedResponse<ChatMessage>
