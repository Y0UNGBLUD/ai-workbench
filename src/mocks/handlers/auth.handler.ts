import { http, delay } from 'msw'
import { mockSuccess } from '../utils/response'

export const authHandlers = [
  http.post('*/api/v1/auth/login', async () => {
    await delay(2000)
    return mockSuccess(
      {
        accessToken: 'accessTokenValue',
        expiresIn: 36000,
        user: {
          id: 1,
          name: '김개발',
          username: 'userid',
          teamId: 1,
          teamName: '개발팀',
          rolses: [],
        },
      },
      200,
      {
        'Set-Cookie':
          'refreshToken=mock-refresh-token; HttpOnly; Path=/; Max-Age=604800; SameSite=Lax',
      },
    )
  }),
  http.post('*/api/v1/auth/refresh', ({ cookies }) => {
    console.log('refreshToken:', cookies.refreshToken)
    return mockSuccess({
      accessToken: 'newAccessToken',
      expiresIn: 36000,
    })
  }),
  http.get('*/api/v1/auth/validate', () => {
    return mockSuccess({
      valid: true,
      user: {
        id: 1,
        name: '김개발',
        username: 'userid',
        teamId: 1,
        teamName: '개발팀',
        rolses: [],
      },
      permission: [],
    })
  }),
  http.post('*/api/v1/auth/logout', () => {
    return mockSuccess({
      message: '로그아웃 완료',
    })
  }),
]
