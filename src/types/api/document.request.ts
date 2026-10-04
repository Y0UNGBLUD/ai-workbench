import type { PaginationRequest } from '@/types/api/common'

// 파일 목록 조회 리퀘스트
export type DocumentListRequest = PaginationRequest<{
  keyword?: string
}>

// 파일 목록 삭제 리퀘스트
export type DocumentDeleteRequest = {
  id: number
}

// 문서 분석 리퀘스트
export type DocumentAnalysisRequest = {
  fileId: string
  retry: boolean
}

// 문서 분석 스트림 리퀘스트
export type DocumentAnalysisStreamRequest = {
  jobId: string
  fileId: string
}

// 문서 채팅 내역 조회
export type DocumentChatHistoryRequest = PaginationRequest<{
  sessionId: number
}>

// 문서 채팅 리퀘스트
export type DocumentChatRequest = {
  sessionId: number
  msg: string
}
