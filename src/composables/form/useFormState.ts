import { reactive, ref, watch } from 'vue'
import { deepClone } from '@/utils/object'

type ValidatorFn<T> = (value: T) => string | null
/**
 * 폼 상태를 관리하고, 필드별 유효성 검사를 제공하는 공용 컴포저블.
 *
 * @template T - 폼 데이터 타입
 * @param {T} initialForm - 초기 폼 값
 * @param {Partial<{ [K in keyof T]: ValidatorFn<T[K]>[] }>} [rules] - 필드별 유효성 검사 규칙
 * @returns {{
 *   form: T,
 *   errors: import('vue').Ref<Partial<Record<keyof T, string>>>,
 *   resetForm: () => void,
 *   validateField: <K extends keyof T>(field: K) => boolean,
 *   validate: () => boolean
 * }}
 *
 * @example
 * ```ts
 * <script setup lang="ts">
 * const { form, errors, resetForm, validateField, validate } = useFormState<{
 *  selected: SelectOption | null
 *  name: string
 *  count: number
 * }>(
 *   {
 *      selected: null,
 *      name: '',
 *      count: 1,
 *   },
 *   {
 *      seleted: [(v) => (!v ? '옵션을 선택하세요.' : null)],
 *      name: [(v) => (!v ? '이름을 입력하세요.' : null)],
 *      count: [(v) => (v > 10 ? '10을 초과할 수 없습니다.' : null)],
 *   }
 * )
 *
 * validateField('username') // 단일 필드 검사
 * validate() // 전체 폼 검사
 * </script>
 *
 * ```
 * ```vue
 * <template>
 *  <FormInput
 *    v-model="form.name"
 *    label="이름"
 *    type="text"
 *    placeholder="이름을 입력하세요"
 *    :has-error="!!errors.name"
 *    :error-msg="errors.name" />
 * </template>
 * ```
 */
export function useFormState<T extends Record<string, any>>(
  initialForm: T,
  rules?: Partial<{ [K in keyof T]: ValidatorFn<T[K]>[] }>,
) {
  const initialSnapshot = deepClone(initialForm)
  const form = reactive(deepClone(initialForm)) as T

  const errors = ref<Partial<Record<keyof T, string>>>({})
  /**
   * 폼을 초기값으로 리셋하고 에러를 초기화한다.
   *
   * @param {T} newData - 덮어쓸 새 데이터. 없으면 초기값으로 리셋
   */
  function resetForm(newData?: T) {
    const data = newData ? deepClone(newData) : deepClone(initialSnapshot)
    // const data = newData ?? initialForm
    // 기존 form 객체 속성 모두 제거
    for (const key in form) delete form[key]
    // 새 값 할당
    Object.assign(form, data)
    errors.value = {}
  }

  /**
   * 특정 필드의 유효성을 검사한다.
   *
   * @template K
   * @param {K} field - 검사할 필드 키
   * @returns {boolean} 유효하면 true, 오류가 있으면 false
   */
  function validateField<K extends keyof T>(field: K): boolean {
    if (!rules?.[field]) return true
    const validators = rules[field]
    const value = form[field]
    for (const validate of validators) {
      const msg = validate(value)
      if (msg) {
        errors.value[field] = msg
        return false
      }
    }
    delete errors.value[field]
    return true
  }
  /**
   * 폼 전체를 검사한다.
   *
   * @returns {boolean} 모든 필드가 유효하면 true, 하나라도 오류가 있으면 false
   */
  function validate(): boolean {
    let valid = true
    if (rules) {
      ;(Object.keys(rules) as (keyof T)[]).forEach((key) => {
        const ok = validateField(key)
        if (!ok) valid = false
      })
    }
    return valid
  }

  /**
   * 유효성 규칙이 걸린 필드 값이 바뀔 때마다 즉시 재검사해 errors 상태를 최신화한다.
   */
  if (rules) {
    ;(Object.keys(rules) as (keyof T)[]).forEach((key) => {
      watch(
        () => form[key],
        () => {
          if (errors.value[key]) {
            validateField(key)
          }
        },
      )
    })
  }

  return {
    form,
    errors,
    resetForm,
    validateField,
    validate,
  }
}
