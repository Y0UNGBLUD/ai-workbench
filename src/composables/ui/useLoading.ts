import { computed, ref } from 'vue'

const SKELETON_DELAY = 150
const MIN_SKELETON_TIME = 500
/**
 * 비동기 작업의 로딩 상태와 에러를 관리하고,
 * Skeleton UI의 표시 지연 및 최소 표시 시간을 제어하는 composable.
 * @returns {{
 * isLoading: import('vue').Ref<boolean>,
 * isLoaded: import('vue').ComputedRef<boolean>,
 * isFirstLoaded: import('vue').Ref<boolean>,
 * isInitialLoading: import('vue').ComputedRef<boolean>,
 * error: import('vue').Ref<Error | null>,
 * isShowSkeleton: import('vue').Ref<boolean>,
 * withLoading: <T>(fn: () => Promise<T>) => Promise<T>
 * }}
 * @example
 *  ```ts
 *  const { isLoading, isLoaded, isInitialLoading, error, isShowSkeleton, withLoading } = useLoading()
 *  const fetchDocuments = async () => {
 *    return withLoading(async () => {
 *      return await getDocuments()
 *    })
 * }
 * ```
 */
export function useLoading() {
  const isLoading = ref(false)
  const isFirstLoaded = ref(false)
  const error = ref<Error | null>(null)
  const isShowSkeleton = ref(false)

  const isLoaded = computed(() => isFirstLoaded.value && !isLoading.value)

  const isInitialLoading = computed(
    () => isLoading.value && !isFirstLoaded.value,
  )

  let skeletonTimer: ReturnType<typeof setTimeout> | undefined

  const clearSkeletonTimer = () => {
    if (skeletonTimer) {
      clearTimeout(skeletonTimer)
      skeletonTimer = undefined
    }
  }

  const wait = (ms: number) =>
    new Promise<void>((resolve) => setTimeout(resolve, ms))

  async function withLoading<T>(fn: () => Promise<T>): Promise<T> {
    clearSkeletonTimer()

    isLoading.value = true
    error.value = null

    const startedAt = performance.now()

    skeletonTimer = setTimeout(() => {
      if (isLoading.value) {
        isShowSkeleton.value = true
      }
    }, SKELETON_DELAY)

    try {
      return await fn()
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err))

      throw err
    } finally {
      clearSkeletonTimer()

      const elapsed = performance.now() - startedAt

      if (isShowSkeleton.value) {
        const remaining = Math.max(MIN_SKELETON_TIME - elapsed, 0)

        if (remaining > 0) {
          await wait(remaining)
        }
      }

      isLoading.value = false
      isFirstLoaded.value = true
      isShowSkeleton.value = false
    }
  }

  return {
    isLoading,
    isLoaded,
    isFirstLoaded,
    isInitialLoading,
    error,
    isShowSkeleton,
    withLoading,
  }
}
