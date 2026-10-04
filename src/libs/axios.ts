// ===================================================
// 📦 Imports
// ===================================================
import axios from 'axios'
import Cookies from 'universal-cookie'
import { notify } from '@/libs/notify'
import { useUserStore } from '@/stores/user'
import router from '@/router/index'

// ===================================================
// 📐 Types / Interfaces
// ===================================================
import type {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios'
import type { ApiError, ApiResponse } from '@/types/api/common'
import type { ApiClient } from '@/types/api/client'

interface RetryableAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

// ===================================================
// 📦 State : 환경 변수
// ===================================================
const isDev = import.meta.env.DEV
const cookies = new Cookies()

// ===================================================
// ⚙️ Methods
// ===================================================
/**
 * API 에러 메시지 추출
 */
const getApiError = (err: unknown): ApiError | null => {
  const axiosError = err as AxiosError<ApiResponse<unknown>>
  return axiosError.response?.data?.error ?? null
}

// ===================================================
// 🛠️ Actions
// ===================================================
/**
 * 인터셉터 공통 적용 함수 - request
 */
const attachRequestInterceptors = (instance: AxiosInstance) => {
  instance.interceptors.request.use((config) => {
    const token = cookies.get('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })
}

/**
 * 인터셉터 공통 적용 함수 - response
 */
const attachResponseInterceptors = (instance: AxiosInstance) => {
  instance.interceptors.response.use(
    ((res: AxiosResponse<ApiResponse<unknown>>) => {
      const body = res.data
      if (body?.success) {
        return body.data
      }
      return Promise.reject(
        new Error(body?.error?.message ?? 'API request failed'),
      )
    }) as unknown as (res: AxiosResponse) => AxiosResponse,
    // error
    async (err: AxiosError<ApiResponse<unknown>>) => {
      const originalRequest = err.config as
        RetryableAxiosRequestConfig | undefined
      const userStore = useUserStore()

      const apiError = getApiError(err)

      if (
        err.response?.status === 401 &&
        originalRequest &&
        !originalRequest._retry
      ) {
        originalRequest._retry = true

        try {
          const newAccessToken = await userStore.refreshToken()

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
          instance.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`

          return instance(originalRequest)
        } catch (refreshError) {
          cookies.remove('accessToken', { path: '/' })

          await router.push('/login')
          userStore.logout()

          notify({
            type: 'negative',
            message: '로그아웃',
            caption: '인증이 만료되었습니다. 다시 로그인해주세요.',
          })

          throw refreshError instanceof Error
            ? refreshError
            : new Error(String(refreshError))
        }
      }

      if (err.code === 'ECONNABORTED') {
        notify({
          type: 'negative',
          message: 'Request Timeout',
          caption: err.message,
        })

        return Promise.reject(err)
      }

      if (apiError) {
        notify({
          type: 'negative',
          message: apiError.message,
          caption: String(apiError.code),
        })

        return Promise.reject(err)
      }

      notify({
        type: 'negative',
        message: '알 수 없는 오류가 발생했습니다.',
        caption: err.message,
      })

      return Promise.reject(
        err instanceof Error ? err : new Error('Unknown error'),
      )
    },
  )
}

// ===================================================
// 🌐 Axios 인스턴스 생성
// ===================================================
// 기본 인스턴스
const api = axios.create({
  baseURL: isDev
    ? '/' // dev: quasar proxy 타기
    : import.meta.env.VITE_API_BASE_URL || '',
  timeout: 300000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
}) as ApiClient
// blob 요청 전용 인스턴스
const rawApi = axios.create({
  baseURL: isDev ? '/' : import.meta.env.VITE_API_BASE_URL || '',
  timeout: 300000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})
// refresh 토큰 갱신 전용 인스턴스 - 인터셉터 설정 별도
const authAxios = axios.create({
  baseURL: isDev ? '/' : import.meta.env.VITE_API_AUTH_URL || '',
  timeout: 300000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
}) as ApiClient
authAxios.interceptors.response.use(
  // response
  ((res: AxiosResponse<ApiResponse<unknown>>) => {
    const body = res.data
    if (body.success) {
      return body.data
    }
    return Promise.reject(new Error(body.error.message))
  }) as unknown as (res: AxiosResponse) => AxiosResponse,
  (err) => {
    return Promise.reject(
      err instanceof Error ? err : new Error('Unknown error'),
    )
  },
)

// ===================================================
// ✏️ 인터셉터 적용
// ===================================================
// 리퀘스트 인터셉터 적용
attachRequestInterceptors(api)
attachRequestInterceptors(rawApi)

// 리스폰스 인터셉터 적용
attachResponseInterceptors(api)

export { api, rawApi, authAxios }
export default api
