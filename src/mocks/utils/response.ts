import { HttpResponse } from 'msw'

type ApiError = {
  code: number
  message: string
}

type ApiResponse<T> = {
  success: boolean
  data: T | null
  error: ApiError | null
}

export function mockSuccess<T>(data: T, status = 200, headers = {}) {
  return HttpResponse.json<ApiResponse<T>>(
    {
      success: true,
      data,
      error: null,
    },
    { status: status, headers: { ...headers } },
  )
}

export function mockFail(error: ApiError, status = 500) {
  return HttpResponse.json<ApiResponse<null>>(
    {
      success: false,
      data: null,
      error,
    },
    { status },
  )
}
