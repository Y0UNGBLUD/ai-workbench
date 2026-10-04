import { api, authAxios, rawApi } from '@/libs/axios'
import type { LoginRequest } from '@/types/api/auth.request'
import type {
  LoginResponse,
  ValidateResponse,
  RefreshTokenResponse,
  StreamTokenResponse,
} from '@/types/api/auth.response'
import Cookies from 'universal-cookie'
const cookies = new Cookies()
let refreshPromise: Promise<string> | null = null

/**
 * 로그인
 */
export function login(params: LoginRequest) {
  return api.post<LoginResponse>(`/api/v1/auth/login`, {
    ...params,
  })
}

/**
 * 로그아웃
 */
export function logout() {
  return api.post(`/api/v1/auth/logout`)
}

/**
 * 토큰 갱신
 */
export function refreshTokenOnce(): Promise<string> {
  // 이미 refresh 진행중이면 기존 Promise 반환
  if (refreshPromise) {
    return refreshPromise
  }

  // refresh 시작
  refreshPromise = authAxios
    .post<RefreshTokenResponse>(
      `/api/v1/auth/refresh`,
      {},
      {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      },
    )
    .then((res) => {
      const newToken = res.accessToken

      cookies.set('accessToken', newToken, { path: '/' })

      return newToken
    })
    .catch((err) => {
      console.error('refresh 실패', err)
      throw err
    })
    .finally(() => {
      // refresh 끝나면 lock 해제
      refreshPromise = null
    })

  return refreshPromise
}

/**
 * 로그인 한 사용자의 정보 조회
 */
export function getUserInfo() {
  return api.get<ValidateResponse>(`/api/v1/auth/validate`)
}

/**
 * 웹소켓 연결을 위한 stream-token 발급
 */
export async function getStreamToken() {
  const res = await rawApi.post<StreamTokenResponse>(
    `/portal/v1/auth/stream-token`,
  )
  return res.data
}
