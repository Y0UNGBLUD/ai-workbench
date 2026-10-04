import type { User } from '@/types/models/user.model'

// 로그인 시 반환되는 데이터
export interface LoginData {
  accessToken: string
  refreshToken: string
  expiresIn: number
  user: User
}
// 로그인 응답 타입
export type LoginResponse = LoginData

// 권한
export type Permission = {
  domain: string
  actionKey: string
  grantedThroughRole: string
}
// 유효성 확인 시 반환되는 데이터
export interface ValidateData {
  valid: boolean
  user: User
  permissions: Permission[]
}
// valid 응답 타입
export type ValidateResponse = ValidateData

// refresh 응답 타입
export type RefreshTokenResponse = {
  accessToken: string
  expiresIn: number
  refreshToken: string
}

// stream-token 응답
export type StreamTokenResponse = {
  token: string
  expiresIn: number
}
