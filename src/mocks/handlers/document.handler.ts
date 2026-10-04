import { http, sse, delay, HttpResponse } from 'msw'
import { mockSuccess, mockFail } from '../utils/response'

export const documentHandlers = [
  // ===================================================
  // 📁 문서 목록 조회
  // ===================================================
  http.get('*/api/v1/document/list', async () => {
    await delay(1500)
    const content = []
    for (let i = 0; i < 10; i++) {
      content.push({
        id: i + 1,
        title: '보고서.pdf',
        fileId: 'file-id-0000-0000',
        filename: 'filename.pdf',
        extension: 'pdf',
        createdAt: '2026-09-16T19:30:00',
        updatedAt: '2026-09-16T19:30:00',
      })
    }
    return mockSuccess({
      content: content,
      size: 10,
      totalElements: 30,
      totalPages: 3,
    })
  }),
  // ===================================================
  // 📁 문서 삭제
  // ===================================================
  http.delete('*/api/v1/document/delete', async () => {
    await delay(1000)
    return mockSuccess({
      success: true,
      message: 'DELETE mock success',
    })
  }),
  // ===================================================
  // 📃 문서 정보 조회
  // ===================================================
  http.get('*/api/v1/document/meta/:id', async ({ params }) => {
    await delay(500)
    const id = Number(params.id)
    return mockSuccess({
      id: id,
      title: '보고서.pdf',
      fileId: 'file-id-0000-0000',
      filename: 'filename.pdf',
      extension: 'pdf',
      createdAt: '2026-09-16T19:30:00',
      updatedAt: '2026-09-16T19:30:00',
    })
  }),
  // ===================================================
  // 📁 문서 파일 다운로드
  // ===================================================
  http.get('*/api/v1/document/file/:id', async () => {
    await delay(300)
    const response = await fetch('/mock/sample.pdf')
    const buffer = await response.arrayBuffer()
    return new HttpResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
      },
    })
  }),
  // ===================================================
  // 📃 문서 분석 요청
  // ===================================================
  http.post('*/api/v1/document/analysis', async ({ params }) => {
    return mockSuccess({
      id: 1,
      fileId: 'file-id-0000-0000',
      filename: 'filename.pdf',
      jobId: 'job_0001',
      sessionId: 2,
      status: 'progress',
      // content
      title: null,
      hashtags: null,
      layout: null,
      content: null,
    })
  }),
  // ===================================================
  // 📃 문서 분석 스트리밍
  // ===================================================
  http.post('*/api/v1/document/stream', () => {
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: string, data: unknown) => {
          const message =
            `event: ${event}\n` + `data: ${JSON.stringify(data)}\n\n`

          controller.enqueue(encoder.encode(message))
        }

        send('connected', {
          event: 'connected',
          status: 'connected',
          data: 'mock-job-123',
        })

        // 제목
        await new Promise((resolve) => setTimeout(resolve, 500))
        send('title', {
          event: 'title',
          status: 'progress',
          data: null,
        })
        await new Promise((resolve) => setTimeout(resolve, 500))
        send('title', {
          event: 'title',
          status: 'complete',
          data: '동적 언어를 위한 Trace 기반 JIT 타입 특수화',
        })

        // 해시태그
        await new Promise((resolve) => setTimeout(resolve, 500))
        send('hashtags', {
          event: 'hashtags',
          status: 'progress',
          data: null,
        })
        await new Promise((resolve) => setTimeout(resolve, 500))
        send('hashtags', {
          event: 'hashtags',
          status: 'complete',
          data: ['태그1', '태그2', '태그3'],
        })
        // 레이아웃
        await new Promise((resolve) => setTimeout(resolve, 500))
        send('layout', {
          event: 'layout',
          status: 'progress',
          data: null,
        })
        await new Promise((resolve) => setTimeout(resolve, 500))
        const response = await fetch('/mock/analysis-bbox.json')
        const bboxData = await response.json()
        send('layout', {
          event: 'layout',
          status: 'complete',
          data: bboxData,
        })
        //본문
        await new Promise((resolve) => setTimeout(resolve, 500))
        send('content', {
          event: 'content',
          status: 'progress',
          data: null,
        })
        await new Promise((resolve) => setTimeout(resolve, 500))
        const content = await fetch('/mock/analysis-result.txt').then((res) =>
          res.text(),
        )
        send('content', {
          event: 'content',
          status: 'complete',
          data: content,
        })
        // 질문
        await new Promise((resolve) => setTimeout(resolve, 500))
        send('questions', {
          event: 'questions',
          status: 'progress',
          data: null,
        })
        await new Promise((resolve) => setTimeout(resolve, 500))
        send('questions', {
          event: 'questions',
          status: 'complete',
          data: [
            'Trace-based JIT가 기존 인터프리터 방식보다 성능을 높일 수 있는 핵심 이유는 무엇인가요?',
            'Trace 기반 타입 특수화에서 Hot Loop를 식별하는 것이 왜 중요한가요?',
            '실행 중 예상하지 못한 타입이나 새로운 실행 경로가 발견되면, 기존에 컴파일된 Trace는 어떻게 처리되나요?',
            'Trace Tree와 일반적인 JIT 컴파일 방식의 차이점은 무엇이며, Trace Tree가 중첩 루프나 여러 실행 경로를 처리하는 데 어떤 장점이 있나요?',
            '타입 특수화를 적용했을 때 발생할 수 있는 문제를 Deoptimization이 어떻게 해결하나요?',
          ],
        })
        // 완료
        send('complete', {
          event: 'complete',
          status: 'complete',
          message: '작업을 완료했습니다.',
        })

        controller.close()
      },
    })

    return new HttpResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  }),
  // ===================================================
  // 💬 채팅 내역 조회
  // ===================================================
  http.get('*/api/v1/document/chat/list', async () => {
    await delay(1500)
    const content = [
      {
        id: 'chat-001',
        sender: 'user',
        type: 'out',
        text: '이 논문에서 제안하는 핵심적인 컴파일 기법은 무엇인가요?',
        time: new Date('2026-09-27T22:10:12'),
        status: 'done',
        meta: [],
      },
      {
        id: 'chat-002',
        sender: 'ai',
        type: 'in',
        text: '실행 중 자주 사용되는 루프의 trace를 식별하고, **실제 동적 타입에 특화된 기계어 코드**를 런타임에 생성하는 기법입니다.',
        time: new Date('2026-09-27T22:10:15'),
        status: 'done',
        meta: [],
      },
      {
        id: 'chat-003',
        sender: 'user',
        type: 'out',
        text: '왜 동적 언어는 기존 컴파일러로 컴파일하기 어려운가요?',
        time: new Date('2026-09-27T22:11:03'),
        status: 'done',
        meta: [],
      },
      {
        id: 'chat-004',
        sender: 'ai',
        type: 'in',
        text: '# 컴파일하기 어려운 이유\n실행 전에 구체적인 타입 정보를 알 수 없기 때문에 모든 가능한 타입 조합을 처리할 수 있는 일반적인 코드를 생성해야 하기 때문입니다.',
        time: new Date('2026-09-27T22:11:07'),
        status: 'done',
        meta: [],
      },
      {
        id: 'chat-005',
        sender: 'user',
        type: 'out',
        text: 'Trace는 어떤 기준으로 선택하나요?',
        time: new Date('2026-09-27T22:11:42'),
        status: 'done',
        meta: [],
      },
      {
        id: 'chat-006',
        sender: 'ai',
        type: 'in',
        text: '런타임에서 자주 실행되는 루프의 경로를 trace로 식별합니다. 이렇게 얻은 실행 경로를 실제로 관찰된 동적 타입에 맞게 특수화합니다.',
        time: new Date('2026-09-27T22:11:48'),
        status: 'done',
        meta: [],
      },
      {
        id: 'chat-007',
        sender: 'user',
        type: 'out',
        text: '이 방식은 중첩된 루프에서도 사용할 수 있나요?',
        time: new Date('2026-09-27T22:12:25'),
        status: 'done',
        meta: [],
      },
      {
        id: 'chat-008',
        sender: 'ai',
        type: 'in',
        text: '네. 논문에서는 중첩된 루프에서 새로운 경로가 발견될 때 이를 점진적으로 컴파일할 수 있는 효율적인 방법을 제시합니다.',
        time: new Date('2026-09-27T22:12:31'),
        status: 'done',
        meta: [],
      },
      {
        id: 'chat-009',
        sender: 'user',
        type: 'out',
        text: '실험 결과 성능은 어느 정도 향상되었나요?',
        time: new Date('2026-09-27T22:13:04'),
        status: 'done',
        meta: [],
      },
      {
        id: 'chat-010',
        sender: 'ai',
        type: 'in',
        text: '논문에서 구현한 JavaScript 동적 컴파일러는 일부 벤치마크 프로그램에서 10배 이상의 속도 향상을 측정했습니다.',
        time: new Date('2026-09-27T22:13:10'),
        status: 'done',
        meta: [],
      },
    ]
    return mockSuccess({
      content: content,
      size: 10,
      totalElements: 30,
      totalPages: 3,
    })
  }),
  // ===================================================
  // 💬 채팅 메시지 전송
  // ===================================================
  http.post('*/api/v1/document/chat/send', () => {
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: string, data: unknown) => {
          const message =
            `event: ${event}\n` + `data: ${JSON.stringify(data)}\n\n`

          controller.enqueue(encoder.encode(message))
        }

        send('progress', {
          event: 'progress',
          data: {
            content: null,
          },
        })

        // 채팅
        await new Promise((resolve) => setTimeout(resolve, 500))
        send('token', {
          event: 'token',
          data: {
            content: '채팅 ',
          },
        })
        await new Promise((resolve) => setTimeout(resolve, 150))
        send('token', {
          event: 'token',
          data: {
            content: '응답입니',
          },
        })
        await new Promise((resolve) => setTimeout(resolve, 150))
        send('token', {
          event: 'token',
          data: {
            content: '다. 안녕하',
          },
        })
        await new Promise((resolve) => setTimeout(resolve, 150))
        send('token', {
          event: 'token',
          data: {
            content: '세요?',
          },
        })

        // 완료
        send('end', {
          event: 'end',
          data: {
            content: '채팅응답입니다. 안녕하세요?',
          },
        })

        controller.close()
      },
    })

    return new HttpResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  }),
]
