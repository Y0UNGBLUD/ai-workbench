import Cookies from 'universal-cookie'
import { useUserStore } from '@/stores/user'

const cookies = new Cookies()

interface FetchOptions extends RequestInit {
  skipAuth?: boolean
}

export function createFetchStream() {
  return async function fetchStream(
    url: string,
    options: FetchOptions = {},
    retry = true,
  ) {
    const userStore = useUserStore()
    const token = cookies.get('accessToken')

    const headers: Record<string, string> = {
      ...(options.skipAuth
        ? {}
        : token
          ? { Authorization: `Bearer ${token}` }
          : {}),
      ...(options.headers as Record<string, string>),
    }

    const res = await fetch(url, {
      credentials: 'include',
      ...options,
      headers,
    })

    // 401 처리
    if (res.status === 401 && retry && !options.skipAuth) {
      const newToken = await userStore.refreshToken()

      if (!newToken) {
        throw new Error('UNAUTHORIZED')
      }

      return fetchStream(
        url,
        {
          ...options,
          headers: {
            ...headers,
            Authorization: `Bearer ${newToken}`,
          },
        },
        false,
      )
    }

    if (!res.ok) {
      const text = await res.text()
      throw new Error(text || res.statusText)
    }

    return res
  }
}
