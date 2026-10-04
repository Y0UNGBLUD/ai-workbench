import { MIME_MAP } from '@/constants/file'

/**
 * 지정한 길이의 랜덤 문자열 ID를 생성한다.
 *
 * @function generateRandomId
 * @param {number} [length=16] - 생성할 문자열의 길이 (기본값 16).
 * @returns {string} 랜덤으로 생성된 ID 문자열.
 *
 * @example
 * generateRandomId()     // "a8Fs0KzQ19LmX3pT"
 * generateRandomId(8)    // "Zx4T9k1L"
 */
export function generateRandomId(length = 16): string {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let result = ''
  for (let i = 0; i < length; i++) {
    const idx = Math.floor(Math.random() * chars.length)
    result += chars[idx]
  }
  return result
}
/**
 * 밀리초(ms)를 받아 "분 초" 형식의 문자열로 변환한다.
 *
 * @function formatTime
 * @param {number} [ms=0] - 변환할 시간(밀리초). 기본값은 0.
 * @returns {string} "X분 Y초" 형태의 문자열. ms가 0이면 빈 문자열 반환.
 *
 * @example
 * formatTime(65000) // "1분 5초"
 * formatTime(0)     // ""
 */
export function formatTime(ms = 0) {
  if (!ms) return ''
  const totalSeconds = Math.floor(ms / 1000) // 전체 초
  const minutes = Math.floor(totalSeconds / 60) // 분
  const seconds = totalSeconds % 60 // 남은 초
  return `${minutes}분 ${seconds}초`
}

/**
 * 파일 확장자
 */
export function getMimeTypeFromFilename(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  return MIME_MAP[ext] || 'application/octet-stream'
}

export function toPascalCase(input: string): string {
  if (!input) return ''

  // 구분자로 분리 ( -, _, 공백 등 )
  const parts = input.split(/[^A-Za-z0-9]+/).filter(Boolean)

  return parts
    .map((part) => {
      // 이미 PascalCase처럼 보이면 그대로 유지
      if (/^[A-Z][a-zA-Z0-9]*$/.test(part)) return part
      // 소문자나 케밥/스네이크 등은 변환
      return part.charAt(0).toUpperCase() + part.slice(1)
    })
    .join('')
}
