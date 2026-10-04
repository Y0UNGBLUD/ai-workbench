import { http, ws, sse } from 'msw'
import { mockSuccess, mockFail } from '../utils/response'

const examWs = ws.link('ws://example.com:5173/v1/ws')

export const exampleHandlers = [
  // http get
  http.get('*/api-test/get', ({ request }) => {
    const url = new URL(request.url)

    // return mockFail(
    //   {
    //     code: 1000222,
    //     message: 'INVALID_ACCESS_TOKEN',
    //   },
    //   403,
    // )
    return mockSuccess({
      params: Object.fromEntries(url.searchParams.entries()),
      content: [
        { id: 1, title: 'mock notice 1' },
        { id: 2, title: 'mock notice 2' },
      ],
      size: 10,
      totalElements: 10,
      totalPages: 1,
    })
  }),
  // http post
  http.post('*/api-test/post', async ({ request }) => {
    const body = await request.json()

    return mockSuccess({
      message: 'POST mock success',
      receivedBody: body,
    })
  }),
  // http put
  http.put('*/api-test/put', async ({ request }) => {
    const body = await request.json()

    return mockSuccess({
      message: 'PUT mock success',
      receivedBody: body,
    })
  }),
  // http delete
  http.delete('*/api-test/delete', ({ request }) => {
    const url = new URL(request.url)

    return mockSuccess({
      message: 'DELETE mock success',
      params: Object.fromEntries(url.searchParams.entries()),
    })
  }),
  // ws
  examWs.addEventListener('connection', ({ client }) => {
    client.send(
      JSON.stringify({
        type: 'ping',
        data: {
          message: 'ping!',
          seq: 1234,
        },
      }),
    )
  }),
  // sse
  sse('*/api-test/sse', ({ client }) => {
    client.send({
      data: JSON.stringify({
        message: 'hello from sse',
      }),
    })

    queueMicrotask(() => {
      client.close()
    })
  }),
]
