// useList.ts
import { computed, reactive, shallowRef, watch } from 'vue'
import { useLoading } from '@/composables/ui/useLoading'
import { usePagination } from '@/composables/data/usePagination'

/**
 * 목록 조회 API의 공통 응답 구조.
 */
export interface ListResponse<T> {
  content: T[]
  totalPages: number
  totalElements: number
}

/**
 * useList 설정.
 *
 * @template T 리스트 아이템 타입
 */
export interface UseListConfig<T> {
  /**
   * 목록 조회 API 함수.
   *
   * @param params API 요청 파라미터
   * @param config 요청 설정
   */
  fetchApi: (
    params?: any,
    config?: { signal?: AbortSignal },
  ) => Promise<ListResponse<T>>

  /** pagination 사용 여부 */
  usePagination?: boolean

  /** filter 사용 여부 */
  useFilter?: boolean

  /** 초기 pagination 설정 */
  initialPagination?: {
    defaultSize?: number
    startPage?: number
  }

  /** 초기 filter 값 */
  initialFilter?: Record<string, any>

  /** API 호출 전 실행 */
  beforeFetch?: (ctx: {
    pagination: ReturnType<typeof usePagination>
    filter: Record<string, any>
  }) => void

  /** API 호출 후 실행 */
  afterFetch?: (ctx: {
    pagination: ReturnType<typeof usePagination>
    filter: Record<string, any>
    result: ListResponse<T>
  }) => void
}

/**
 * 목록 조회를 위한 범용 composable.
 *
 * API 호출을 통해 리스트 데이터를 조회하고 다음 기능을 제공한다:
 * - 리스트 상태 관리
 * - pagination 관리
 * - 검색 filter 관리
 * - loading 상태 관리
 * - skeleton 표시 여부 제어
 * - 중복 요청 취소
 *
 * API 응답은 다음과 같은 공통 구조를 사용한다:
 *
 * {
 *   content: T[],
 *   totalPages: number,
 *   totalElements: number
 * }
 *
 * @template T 리스트 아이템 타입
 *
 * @param config useList 설정 객체
 *
 * @example
 * ```ts
 * const {
 *   list,
 *   pagination,
 *   fetchList,
 *   isListLoading,
 *   isListLoaded,
 *   isEmpty,
 * } = useList<User>({
 *   fetchApi: (params) => getUsers({ ...params }),
 *
 *   usePagination: true,
 *
 *   initialPagination: {
 *     defaultSize: 20,
 *     startPage: 0,
 *   },
 *
 *   initialFilter: {
 *     keyword: '',
 *   },
 * })
 * ```
 */
export function useList<T>(config: UseListConfig<T>) {
  const {
    fetchApi,
    usePagination: enablePagination = true,
    useFilter = true,
    initialPagination = {},
    initialFilter = {},
  } = config

  // ===================================================
  // 📦 State
  // ===================================================
  const list = shallowRef<T[]>([])
  const filter = reactive({ ...initialFilter })

  const pagination = usePagination(initialPagination)

  let controller: AbortController | null = null

  // ===================================================
  // ⏳ Loading State
  // ===================================================

  const {
    isLoading,
    isFirstLoaded,
    isLoaded,
    isShowSkeleton,
    error,
    withLoading,
  } = useLoading()

  // ===================================================
  // ⚙️ Methods
  // ===================================================

  /**
   * 목록 데이터를 조회한다.
   *
   * filter 및 pagination 옵션이 활성화되어 있으면
   * 해당 값들이 API 파라미터에 자동으로 포함된다.
   *
   * @param extraParams 추가 API 파라미터
   * @param externalSignal 외부 AbortSignal
   */
  const fetchList = async (
    extraParams?: Record<string, any>,
    externalSignal?: AbortSignal,
  ) => {
    controller?.abort()
    controller = new AbortController()

    await withLoading(async () => {
      const signal = externalSignal ?? controller?.signal

      config.beforeFetch?.({
        pagination,
        filter,
      })

      const params: Record<string, any> = {
        ...extraParams,
      }

      if (useFilter) {
        Object.assign(params, filter)
      }

      if (enablePagination) {
        params.page = pagination.page
        params.size = pagination.pageSize
      }

      try {
        const response = await fetchApi(params, signal ? { signal } : undefined)

        list.value = response.content

        if (enablePagination) {
          pagination.setTotalPages(response.totalPages)
          pagination.setTotalElements(response.totalElements)
        }

        config.afterFetch?.({
          pagination,
          filter,
          result: response,
        })
      } catch (err: unknown) {
        // Axios의 취소 에러
        if (err instanceof Error && err.name === 'CanceledError') {
          return
        }

        error.value = err instanceof Error ? err : new Error(String(err))
      }
    })
  }

  /**
   * 페이지를 시작 페이지로 초기화한다.
   */
  const resetPage = () => {
    pagination.resetPage()
  }

  /**
   * filter 값을 초기 상태로 되돌린다.
   */
  const resetFilter = () => {
    Object.assign(filter, initialFilter)
  }

  /**
   * 목록 상태를 초기화한다.
   *
   * - pagination 초기화
   * - filter 초기화
   * - list 초기화
   * - loading 상태 초기화
   *
   * @param fetchAfterReset 초기화 후 자동 조회 여부
   */
  const resetList = async (fetchAfterReset = true) => {
    resetPage()
    resetFilter()

    list.value = []

    isFirstLoaded.value = false
    error.value = null

    if (fetchAfterReset) {
      await fetchList()
    }
  }
  /**
   * 페이지를 첫 페이지로 초기화하고 목록을 조회한다.
   * 이미 첫 페이지인 경우 목록만 다시 조회한다.
   */
  const resetPageAndFetch = async () => {
    if (pagination.page === 1) {
      await fetchList()
    } else {
      resetPage()
    }
  }

  // ===================================================
  // 🧮 Computed
  // ===================================================

  const isEmpty = computed(() => list.value.length === 0)

  // ===================================================
  // 👀 Watchers
  // ===================================================
  watch(
    () => pagination.page,
    () => {
      fetchList()
    },
  )
  // ===================================================
  // 😊 Return
  // ===================================================

  return {
    // state
    list,
    filter,
    pagination,

    // loading
    isListLoading: isLoading,
    isListFirstLoaded: isFirstLoaded,
    isListLoaded: isLoaded,
    listError: error,
    isShowSkeleton,

    // computed
    isEmpty,

    // methods
    fetchList,
    resetList,
    resetPage,
    resetFilter,
    resetPageAndFetch,
  }
}
