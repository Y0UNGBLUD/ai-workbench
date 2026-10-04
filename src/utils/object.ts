import { toRaw } from 'vue'

/**
 * 객체를 깊은 복사(Deep Clone)합니다.
 *
 * - 가능하면 브라우저 내장 `structuredClone()`을 사용하고,
 *   지원되지 않는 환경에서는 `JSON.parse(JSON.stringify(obj))`로 대체합니다.
 * - `undefined`, `Symbol`, `Function` 등은 JSON 기반 복제 시 손실될 수 있습니다.
 *
 * @template T 복제할 객체의 타입
 * @param {T} obj 복제할 원본 객체
 * @returns {T} 깊은 복사된 새 객체
 *
 * @example
 * const original = { a: 1, b: { c: 2 } }
 * const copy = deepClone(original)
 * copy.b.c = 3
 * console.log(original.b.c) // 2 (원본은 영향 없음)
 */
export function deepClone<T>(obj: T): T {
  try {
    return structuredClone(toRaw(obj))
  } catch {
    return JSON.parse(JSON.stringify(toRaw(obj)))
  }
}

/**
 * 두 값에 대해 깊은 동등성 비교를 수행합니다.
 *
 * 이 함수는 원시 값, 배열, 일반 객체, 중첩 구조를 비교합니다.
 * 또한 내부적으로 `WeakMap`을 사용하여 순환 참조가 있는 경우도 안전하게 처리합니다.
 *
 * ### 특징
 * - 중첩된 객체와 배열에 대한 깊은 비교
 * - `null`, 원시 타입, `Object.is`의 edge case를 올바르게 처리
 * - 순환 참조로 인해 발생할 수 있는 무한 재귀 방지
 * - 객체의 프로토타입까지 비교하여 정확한 구조적 동등성 보장
 *
 * @param a - 비교할 첫 번째 값
 * @param b - 비교할 두 번째 값
 * @param visited - 순환 참조 처리를 위해 이미 비교된 객체 쌍을 저장하는 내부 맵.
 *                  (사용자가 직접 전달할 필요는 없음)
 *
 * @returns 두 값이 깊은 동등성을 가지면 `true`, 그렇지 않으면 `false`
 *
 * @example
 * deepEqual({ x: 1, y: [1, 2] }, { x: 1, y: [1, 2] }) // true
 *
 * @example
 * const obj: any = {};
 * obj.self = obj;
 * deepEqual(obj, obj); // true (순환 참조 처리됨)
 */
export function deepEqual(a: any, b: any, visited = new WeakMap()): boolean {
  a = toRaw(a)
  b = toRaw(b)
  if (Object.is(a, b)) return true

  // null 또는 원시값 비교
  if (
    a === null ||
    b === null ||
    typeof a !== 'object' ||
    typeof b !== 'object'
  ) {
    return a === b
  }

  // 순환참조 방지
  if (visited.has(a)) return visited.get(a) === b
  visited.set(a, b)

  // 타입 다르면 false
  if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) return false

  const keysA = Object.keys(a)
  const keysB = Object.keys(b)

  if (keysA.length !== keysB.length) return false

  for (const key of keysA) {
    if (!keysB.includes(key)) return false
    if (!deepEqual(a[key], b[key], visited)) return false
  }

  return true
}
