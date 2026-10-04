import type { BaseRecord } from '@/types/models/base.model'

export interface Document {
  title: string
  fileId: string
  filename: string
  extension: string
}
export type StoredDocument = BaseRecord & Document

// 문서 분석 정보
export interface DocumentDetail extends BaseRecord {
  fileId: string
  filename: string
  jobId: string
  sessionId: number
  status: null | 'progress' | 'complete' | 'faild' | 'error'
  // content
  title: string | null
  hashtags: string | null
  layout: string | null
  content: string | null
  questions: string[] | null
}
