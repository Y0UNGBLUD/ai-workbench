export type SseEventHandler<T> = (data: T, event: string) => void

export async function consumeSseStream<T>(
  response: Response,
  onEvent: SseEventHandler<T>,
  controller: AbortController,
) {
  if (!response.body) {
    throw new Error('NO_STREAM')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()

  let buffer = ''

  // 마지막 데이터 수신 시각
  let lastReceivedAt = Date.now()

  // idle timeout: 60초 동안 데이터가 없으면 timeout
  const idleTimeoutMs = 60_000

  // timeout에 의한 abort인지 직접 abort한 것인지 구분
  let isTimedOut = false

  const idleTimeoutCheck = setInterval(() => {
    if (Date.now() - lastReceivedAt > idleTimeoutMs) {
      console.log('[SSE] idle timeout')

      isTimedOut = true
      controller.abort()
    }
  }, 1_000)

  /**
   * 하나의 SSE 이벤트를 파싱하고 callback을 실행한다.
   */
  const dispatchEvent = (rawEvent: string) => {
    if (!rawEvent.trim()) return

    let eventName = 'message'
    const dataLines: string[] = []

    for (const line of rawEvent.split(/\r?\n/)) {
      if (line.startsWith('event:')) {
        eventName = line.slice(6).trim()
      } else if (line.startsWith('data:')) {
        dataLines.push(line.slice(5).trimStart())
      }
    }

    if (dataLines.length === 0) return

    // 여러 data: 라인은 newline으로 연결
    const data = dataLines.join('\n')

    try {
      onEvent(JSON.parse(data) as T, eventName)
    } catch {
      onEvent(data as T, eventName)
    }
  }

  try {
    while (true) {
      const { done, value } = await reader.read()

      if (done) break

      // 실제 데이터가 들어왔으므로 idle timer 갱신
      lastReceivedAt = Date.now()

      buffer += decoder.decode(value, { stream: true })

      // \n\n / \r\n\r\n 모두 대응
      const events = buffer.split(/\r?\n\r?\n/)

      // 아직 완성되지 않은 이벤트는 buffer에 유지
      buffer = events.pop() ?? ''

      for (const rawEvent of events) {
        dispatchEvent(rawEvent)
      }
    }

    // decoder에 남아있는 데이터 처리
    buffer += decoder.decode()

    // 마지막 이벤트가 \n\n 없이 종료된 경우 처리
    if (buffer.trim()) {
      dispatchEvent(buffer)
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      if (isTimedOut) {
        throw new Error('STREAM_TIMEOUT')
      }

      // timeout이 아닌 의도적인 abort
      return
    }

    throw error
  } finally {
    clearInterval(idleTimeoutCheck)
    reader.releaseLock()
  }
}
