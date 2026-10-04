import { ref, reactive } from 'vue'

/**
 * 페이지네이션 상태를 관리하는 공용 컴포저블.
 *
 * @param {Object} [options] - 페이지네이션 옵션
 * @param {number} [options.defaultSize=10] - 기본 페이지 크기
 * @param {number} [options.startPage=1] - 페이지 시작 번호
 *
 * @returns {{
 *   page: import('vue').Ref<number>,
 *   pageSize: import('vue').Ref<number>,
 *   totalPages: import('vue').Ref<number>,
 *   totalElements: import('vue').Ref<number>,
 *   resetPage: () => void,
 *   setPage: (pageVal: number) => void,
 *   setTotalPages: (max: number) => void,
 *   setTotalElements: (count: number) => void
 * }}
 *
 * @example
 * ```ts
 * <script setup lang="ts">
 * const {
 *   page,
 *   pageSize,
 *   totalPages,
 *   totalElements,
 *   resetPage,
 *   setPage,
 *   setTotalPages,
 *   setTotalElements,
 * } = usePagination()
 *
 * console.log(page.value)       // 1
 * setPage(3)                    // 페이지를 3으로 설정
 * setTotalPages(5)              // 전체 페이지 수를 5로 설정
 * setTotalElements(50)          // 전체 아이템 수를 50으로 설정
 * resetPage()                   // 페이지를 1로 초기화
 * ```
 *
 * @example
 * ```ts
 * // 페이지 시작 번호 및 페이지 크기 지정
 * const {
 *   page,
 *   pageSize,
 * } = usePagination({
 *   defaultSize: 20,
 *   startPage: 0,
 * })
 *
 * console.log(page.value)       // 0
 * console.log(pageSize.value)   // 20
 * ```
 *
 * @example
 * ```ts
 * // 목록 조회 시 페이지 정보 전달
 * const fetchList = async (params?: any) => {
 *   await withLoading(async () => {
 *     await getExampleList({
 *       page: page.value,
 *       pageSize: pageSize.value,
 *       ...params,
 *     })
 *       .then((res) => {
 *         setTotalPages(res.data.data.totalPages)
 *         setTotalElements(res.data.data.totalElements)
 *         list.value = res.data.data.content ?? []
 *       })
 *       .catch((err) => {
 *         console.log(err)
 *       })
 *   })
 * }
 * ```
 *
 * @example
 * ```ts
 * // 검색 시 페이지 초기화
 * const onSearch = async () => {
 *   resetPage()
 *   await fetchList(searchOption)
 * }
 * ```
 *
 * @example
 * ```vue
 * <template>
 *   <Pagination
 *     v-model="page"
 *     :max="totalPages"
 *     @change="fetchList"
 *   />
 * </template>
 * ```
 */
export function usePagination({
  defaultSize = 10,
  startPage = 1,
}: {
  defaultSize?: number
  startPage?: number
} = {}) {
  const page = ref(startPage)
  const pageSize = ref(defaultSize)
  const totalPages = ref(1)
  const totalElements = ref(0)

  /**
   * 페이지를 1로 초기화
   */
  const resetPage = () => {
    page.value = 1
  }

  /**
   * 페이지를 지정한 값으로 설정
   * @param {number} pageVal - 설정할 페이지 번호
   */
  const setPage = (pageVal: number) => {
    page.value = pageVal
  }

  /**
   * 전체 페이지 수를 설정
   * @param {number} max - 전체 페이지 수
   */
  const setTotalPages = (max: number) => {
    if (!max) {
      totalPages.value = 1
      return
    } else {
      totalPages.value = max
    }
  }

  /**
   * 전체 아이템 수를 저장
   * @param {number} count - 전체 아이템 수
   */
  const setTotalElements = (count: number) => {
    totalElements.value = count || 0
  }

  return reactive({
    page,
    pageSize,
    totalPages,
    totalElements,
    resetPage,
    setPage,
    setTotalPages,
    setTotalElements,
  })
}
