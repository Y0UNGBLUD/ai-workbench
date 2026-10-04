export interface ApiError {
  code: number
  message: string
}

export interface ApiSuccessResponse<T> {
  success: true
  data: T
  error: null
}

export interface ApiFailResponse {
  success: false
  data: null
  error: ApiError
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiFailResponse

// 페이징
export type PaginationRequest<T extends object = object> = {
  page: number
  size: number
} & T
export interface PaginatedResponse<T> {
  content: T[]
  size: number
  totalElements: number
  totalPages: number
}

// STOMP 응답 : history, realtime
export interface StompMessageResponse<T extends string> {
  event_type: T
}
