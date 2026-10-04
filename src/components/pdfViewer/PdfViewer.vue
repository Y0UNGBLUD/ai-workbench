<template>
  <div class="pdf-viewer">
    <div class="pdf-viewer__container">
      <Toolbar
        :disabled="!isDocLoaded"
        :current-page="currentPage"
        :total-page="numPages"
        :hide-highlight="!!hideHighlight"
        :hide-collapse="!!hideCollapse"
        :zoom-percent="zoomPercent"
        v-model:is-show-sidebar="isShowSidebar"
        v-model:selected-highlight-color="selectedHighlightColor"
        v-model:selected-scale="selectedScale"
        @collapse="$emit('collapse')"
        @page-prev="goPrevPage"
        @page-next="goNextPage"
        @zoom-in="zoomIn"
        @zoom-out="zoomOut" />
      <div class="pdf-viewer__content">
        <transition name="fade">
          <Thumbnails
            v-show="isShowSidebar"
            v-model:current-page="currentPage"
            :pdf-doc="pdfDoc"
            :pages="pages"
            @select="scrollToPage($event)" />
        </transition>
        <div ref="pdfContainerRef" class="canvas-container">
          <q-virtual-scroll
            ref="virtualScrollRef"
            :items="pages"
            :virtual-scroll-item-size="itemHeight"
            :virtual-scroll-slice-size="20"
            separator
            v-slot="{ item }"
            style="min-width: 100%; height: 100%"
            @virtual-scroll="onVirtualScroll">
            <div
              class="pdf-page"
              :style="{
                position: 'relative',
                marginBottom: `${PAGE_GAP}px`,
                width: `${itemWidth}px`,
                height: `${itemHeight - PAGE_GAP}px`,
              }"
              :key="item">
              <!-- <span style="position: absolute">{{ item }}</span> -->
              <canvas
                :ref="(el) => setCanvasRef(el as HTMLCanvasElement, item)"
                :style="`width:${itemWidth}px; height: ${itemHeight - PAGE_GAP}px`"></canvas>
              <div
                v-if="
                  pageRenderState[item] === 'rendering' ||
                  pageRenderState[item] === 'idle'
                "
                class="page-overlay"
                style="
                  position: absolute;
                  z-index: 1;
                  top: 0;
                  bottom: 0;
                  display: flex;
                  align-items: center;
                  margin: auto;
                ">
                <q-spinner size="30px" />
              </div>
              <!-- bbox group -->
              <template v-if="isShowHighlightBox">
                <div
                  v-for="(box, index) in getBoxesForPage(bboxGroup, item)"
                  :key="`box${box.keyId ?? null}-${index}-${blinkCounter}`"
                  class="bbox bbox--group"
                  :style="getBoxStyle(item, box.bbox, 'group')"
                  :class="{
                    'is-blink': pdfViewerStore.selectedFootnote?.id == box.id,
                  }"></div>
              </template>
            </div>
          </q-virtual-scroll>
        </div>

        <!-- error -->
        <div v-if="isShowError" class="pdf-viewer__empty">
          <div class="pdf-viewer__empty-inner has-error">
            <div class="pdf-viewer__spinner">
              <q-icon
                name="octagon-alert"
                class="pdf-viewer__empty-icon"
                size="32" />
              <span class="q-mt-md">PDF 파일을 불러오지 못했습니다.</span>
            </div>
          </div>
        </div>
        <!-- loading -->
        <div
          v-else-if="isShowLoading"
          class="pdf-viewer__empty is-blur"
          :class="{ 'is-blur': pdfDoc }">
          <div class="pdf-viewer__empty-inner">
            <div class="pdf-viewer__spinner">
              <q-spinner size="xl" color="secondary"></q-spinner>
              <span class="q-mt-md">PDF 파일을 불러오는 중입니다...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
// ===================================================
// 🧠 Vue Core
// ===================================================
import {
  reactive,
  ref,
  onMounted,
  watch,
  onBeforeUnmount,
  nextTick,
  computed,
  provide,
} from 'vue'

// ===================================================
// 🧩 Components
// ===================================================
import Thumbnails from './partials/Thumbnails.vue'
import Toolbar from './partials/Toolbar.vue'
import { QIcon, QSpinner, QVirtualScroll } from 'quasar'

// ===================================================
// 📖 External Library
// ===================================================
import pdfjsLib from '@/libs/pdfjs'

// ===================================================
// 📐 Types / Interfaces
// ===================================================
import type { CSSProperties } from 'vue'
import type { Bbox } from '@/types/components/pdfViewer.ts'
import type { RGB, HighlightColor } from '@/types/components/pdfViewer'
type Size = { w: number; h: number }
type ScrollEdge =
  | 'start'
  | 'center'
  | 'end'
  | 'start-force'
  | 'center-force'
  | 'end-force'
  | undefined

// ===================================================
// 🪝 Composables / Hooks
// ===================================================
import { usePdfViewerStore } from '@/stores/pdfViewer'
const pdfViewerStore = usePdfViewerStore()

// ===================================================
// 📥 Props / Emits
// ===================================================
const props = defineProps<{
  file: File | null
  isDownloadError?: Error | null
  isDownloadingFile?: boolean
  initialPage?: number | null
  hideHighlight?: boolean
  hideCollapse?: boolean
}>()

// ===================================================
// 📦 State
// ===================================================

// refs
const pdfContainerRef = ref<HTMLDivElement | null>(null)
const canvasRefs: Record<number, HTMLCanvasElement | null> = {}
const virtualScrollRef = ref<QVirtualScroll | null>(null)
let scrollEl: HTMLElement | null = null
// renders
const pageRenderState = reactive<Record<number, 'idle' | 'rendering' | 'done'>>(
  {},
)
let rendering = false
const queue: number[] = [] // 렌더링 대기 큐. 화면에 들어온 페이지 순차 렌더링
const renderedPages = new Set<number>() // 렌더링 완료된 페이지 목록. 중복 렌더 방지

// pages
const numPages = ref(0)
const currentPage = ref(1)
let pdfDoc: any = null // pdf 객체 저장
const originalPageSizes: Record<number, Size> = reactive({})
const pageCssSizes: Record<number, Size> = reactive({})
const PAGE_GAP = 16
const pageWidth = ref(707)
const pageHeight = ref(1000)
const visibleRange = ref({ from: 0, to: 0 })
// scale
const selectedScale = ref('pageFit')
const ZOOM_MIN_PERCENT = 50
const ZOOM_MAX_PERCENT = 200
const ZOOM_STEP = 10
const scale = ref(1) // 실제 크기 배율
const baseScale = ref(1) // 사용자가 보는 배율
const isZooming = ref(false)
let zoomPageNumber: number | null = null
let zoomTimer: any = null
// scroll
let scrollTimer: any = null
const isScrolling = ref(false)
// ui : loading
const isDocLoaded = ref(false)
const isPageLoaded = reactive<Record<number, boolean>>({})

// ui : toolbar
const isShowSidebar = ref(false)

// ui : bbox & highlight
const selectedHighlightColor = ref<HighlightColor>({
  name: 'coral',
  value: [255, 112, 88],
})
const isShowHighlightBox = ref(false)
const blinkCounter = ref(0)
const bboxGroup = ref<any[]>([])
const isShowLayoutBox = ref<null | string>(null)

// ===================================================
// 🧮 Computed
// ===================================================
const isShowLoading = computed(() => {
  return !!props.isDownloadingFile || !isDocLoaded.value
})
const isShowError = computed(() => {
  return !!props.isDownloadError
})
const pages = computed(() =>
  Array.from({ length: numPages.value }, (_, i) => i + 1),
)
const itemWidth = computed(() => {
  return Math.floor(pageWidth.value * scale.value)
})
const itemHeight = computed(() => {
  return Math.floor(pageHeight.value * scale.value) + PAGE_GAP
})
const zoomPercent = computed(() =>
  Math.round((scale.value / baseScale.value) * 100),
)

// ===================================================
// 🛠️ Actions
// ===================================================
/**
 * 로드 : 파일 불러오기
 */
const loadFile = async () => {
  if (!props.file) return
  isDocLoaded.value = false
  const arrayBuffer = await props.file.arrayBuffer()
  pdfDoc = await pdfjsLib.getDocument({
    data: arrayBuffer,
    cMapUrl: '/pdfjs/cmaps/',
    cMapPacked: true,
  }).promise
  numPages.value = pdfDoc.numPages

  await nextTick()
  if (pdfContainerRef.value && pdfDoc) {
    const page = await pdfDoc.getPage(1)
    const viewport = page.getViewport({
      scale: 1,
      rotate: page.rotate,
      dontFlip: false,
    })
    const containerWidth = pdfContainerRef.value.clientWidth
    scale.value = containerWidth / viewport.width
    baseScale.value = scale.value
  } else {
    scale.value = 1
    baseScale.value = 1
  }
  selectedScale.value = 'pageFit'
  void initBaseSize()

  await nextTick(() => {
    isDocLoaded.value = true
  })
}

/**
 * VirtualScroll 스크롤 이벤트 핸들러
 *
 * 현재 화면에 보이는 페이지 범위를 저장하고,
 * 사용자가 스크롤을 멈췄을 때 주변 페이지를 렌더링하도록 트리거한다.
 *
 * 스크롤 중에는 렌더링을 지연시켜 불필요한 PDF 렌더 작업을 줄인다.
 *
 * @param info - VirtualScroll 상태 정보
 * @param info.from - 현재 화면에 보이는 시작 인덱스
 * @param info.to - 현재 화면에 보이는 끝 인덱스
 * @param info.index - 현재 기준 인덱스
 * @param info.direction - 스크롤 방향
 */
function onVirtualScroll(info: {
  from: number
  to: number
  index: number
  direction: string
}) {
  currentPage.value = info.index + 1
  isScrolling.value = true
  visibleRange.value = {
    from: info.from,
    to: info.to,
  }
  clearTimeout(scrollTimer)
  scrollTimer = setTimeout(() => {
    isScrolling.value = false
    renderVisiblePages()
  }, 120)
}

/**
 * VirtualScroll에서 생성된 canvas 요소를 등록한다.
 *
 * 각 페이지 번호에 해당하는 canvas DOM을 저장하고,
 * 해당 페이지를 렌더링 큐에 등록한다.
 *
 * VirtualScroll 특성상 DOM이 재사용되거나 제거될 수 있기 때문에
 * canvas가 다시 mount될 때 renderedPages 상태를 초기화하여
 * 재렌더링이 가능하도록 한다.
 *
 * @param el - 페이지에 연결된 canvas element
 * @param pageNum - PDF 페이지 번호 (1-base)
 */
function setCanvasRef(el: HTMLCanvasElement | null, pageNum: number) {
  if (!el) return
  canvasRefs[pageNum] = el
  renderedPages.delete(pageNum) // 재사용 대비
  if (!pageRenderState[pageNum]) {
    pageRenderState[pageNum] = 'idle'
  }
  void enqueueRender(pageNum)
}

/**
 * 페이지 렌더링을 큐에 등록한다.
 *
 * VirtualScroll 환경에서 캔버스가 DOM에 생성된 이후 렌더링이 가능하기 때문에
 * nextTick 이후에 큐에 페이지를 추가한다.
 *
 * 이미 렌더링된 페이지는 중복 렌더링을 방지하기 위해 큐에 넣지 않는다.
 *
 * @param pageNum - 렌더링할 PDF 페이지 번호 (1-base)
 * @returns Promise<void>
 */
async function enqueueRender(pageNum: number) {
  await nextTick()
  if (renderedPages.has(pageNum)) return
  queue.push(pageNum)
  void processQueue()
}

/**
 * 렌더링 큐를 처리한다.
 *
 * 한 번에 하나의 페이지만 렌더링하도록 직렬 처리하여
 * CPU 사용량 급증 및 pdf.js 렌더 충돌을 방지한다.
 *
 * 큐에 페이지가 남아있으면 재귀적으로 다음 렌더를 실행한다.
 *
 * @returns Promise<void>
 */
async function processQueue() {
  if (rendering || queue.length === 0) return
  rendering = true
  const pageNum = queue.shift()!
  await renderPage(pageNum)
  renderedPages.add(pageNum)
  rendering = false
  void processQueue()
}

/**
 * 실제 PDF 페이지를 Canvas에 렌더링한다.
 *
 * 동작 과정:
 * 1. canvas 참조 확인
 * 2. 이미 동일 page + scale로 렌더된 경우 스킵
 * 3. pdf.js로 페이지 로드
 * 4. viewport 계산
 * 5. devicePixelRatio를 반영한 canvas 사이즈 설정
 * 6. pdf.js render 실행
 *
 * 렌더 상태는 pageRenderState로 관리된다.
 *
 * @param i - 렌더링할 PDF 페이지 번호 (1-base)
 * @returns Promise<void>
 */
async function renderPage(i: number) {
  if (!pdfDoc) return

  const canvas = canvasRefs[i]
  if (!canvas) return

  // 이미 완료됐으면 스킵
  if (
    canvas.dataset.page === String(i) &&
    canvas.dataset.scale === String(scale.value)
  ) {
    pageRenderState[i] = 'done'
    return
  }

  pageRenderState[i] = 'rendering' // 렌더 시작
  await nextTick()
  const page = await pdfDoc.getPage(i)

  const viewport = page.getViewport({
    scale: scale.value,
    rotation: page.rotate,
  })
  const ctx = canvas.getContext('2d')!
  const dpr = window.devicePixelRatio || 1

  const requiredWidth = Math.floor(viewport.width * dpr)
  const requiredHeight = Math.floor(viewport.height * dpr)

  originalPageSizes[i] = {
    w: viewport.width * dpr,
    h: viewport.height * dpr,
  }

  if (canvas.width !== requiredWidth || canvas.height !== requiredHeight) {
    canvas.width = requiredWidth
    canvas.height = requiredHeight
    canvas.style.width = viewport.width + 'px'
    canvas.style.height = viewport.height + 'px'
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    pageCssSizes[i] = { w: viewport.width, h: viewport.height }
  }

  await page.render({
    canvasContext: ctx,
    viewport,
  }).promise

  canvas.dataset.page = String(i)
  canvas.dataset.scale = String(scale.value)

  pageRenderState[i] = 'done' // 🔥 렌더 완료
}

/**
 * PDF 문서의 기본 페이지 크기를 초기화한다.
 *
 * 첫 번째 페이지를 기준으로 원본 width / height를 계산하여
 * 전체 페이지 레이아웃 계산 및 VirtualScroll item 크기 산정에 사용한다.
 *
 * scale=1 기준의 viewport를 사용한다.
 *
 * @returns Promise<void>
 */
async function initBaseSize() {
  const page = await pdfDoc.getPage(1)
  const viewport = page.getViewport({
    scale: 1,
    rotation: page.rotate,
  })
  pageWidth.value = viewport.width
  pageHeight.value = viewport.height
}

/**
 * 현재 화면에 보이는 페이지와 주변 버퍼 영역을 렌더링 큐에 추가한다.
 *
 * VirtualScroll 특성상 화면에 보이는 페이지만 DOM에 존재하기 때문에
 * 현재 visible range 기준으로 일정 buffer 범위를 추가하여
 * 스크롤 시 렌더 지연을 줄인다.
 *
 * 이미 렌더링된 페이지는 중복 렌더링을 방지한다.
 */
function renderVisiblePages() {
  const { from, to } = visibleRange.value

  const buffer = 2

  const start = Math.max(0, from - buffer)
  const end = Math.min(pages.value.length - 1, to + buffer)

  for (let i = start; i <= end; i++) {
    const pageNum = pages.value[i]
    if (pageNum && !renderedPages.has(pageNum)) {
      void enqueueRender(pageNum)
    }
  }
}

// ===================================================
// ⚙️ Methods
// ===================================================

/**
 * 이전 페이지로 이동한다.
 */
const goPrevPage = () => {
  if (currentPage.value > 1) {
    scrollToPage(currentPage.value - 1)
  }
}
/**
 * 다음 페이지로 이동한다.
 */
const goNextPage = () => {
  if (currentPage.value < numPages.value) {
    scrollToPage(currentPage.value + 1)
  }
}
/**
 * 특정 페이지로 이동한다.
 * @param toPage 이동할 페이지 번호
 */
const goToPage = (toPage: number) => {
  let pageNum = toPage
  if (isNaN(pageNum)) return
  if (pageNum < 1) pageNum = 1
  if (pageNum > numPages.value) pageNum = numPages.value
  scrollToPage(pageNum)
}
defineExpose({ goToPage })

/**
 * 특정 페이지로 스크롤을 이동한다.
 * @param pageNum 이동할 페이지 번호
 */
const scrollToPage = (pageNum: number, edge: ScrollEdge = 'center') => {
  if (!virtualScrollRef.value) return
  virtualScrollRef.value?.scrollTo(pageNum - 1, edge)
}

/**
 * 줌 인 - 확대
 */
const zoomIn = async () => {
  isZooming.value = true
  const next = Math.min(zoomPercent.value + 10, ZOOM_MAX_PERCENT)
  await applyButtonZoom(next)
}

/**
 * 줌 아웃 - 축소
 */
const zoomOut = async () => {
  const next = Math.max(zoomPercent.value - 10, ZOOM_MIN_PERCENT)
  await applyButtonZoom(next)
}

/**
 * 줌 버튼 핸들러
 * @param nextPercentet 배율
 */
const applyButtonZoom = async (nextPercent: number) => {
  const container = pdfContainerRef.value
  if (!container) return

  isZooming.value = true
  clearTimeout(scrollTimer)

  if (zoomPageNumber === null) {
    zoomPageNumber = currentPage.value
  }

  const page = zoomPageNumber

  const oldScale = scale.value
  scale.value = baseScale.value * (nextPercent / 100)

  const scaleRatio = scale.value / oldScale

  // 📌 viewport center 기준 보정
  const centerX = container.clientWidth / 2
  const centerY = container.clientHeight / 2

  container.scrollLeft = (container.scrollLeft + centerX) * scaleRatio - centerX
  // container.scrollTop = (container.scrollTop + centerY) * scaleRatio - centerY
  container.scrollTop = (page - 1) * itemHeight.value - itemHeight.value / 2
  virtualScrollRef.value?.refresh()
  if (currentPage.value !== page) {
    currentPage.value = page
  }
  await nextTick()
  virtualScrollRef.value?.refresh()

  isZooming.value = false
  clearTimeout(zoomTimer)
  zoomTimer = setTimeout(() => {
    // scrollToPage(page, 'center') // 현재페이지 튀는 것 방지
    zoomPageNumber = null
  }, 500)
}

/**
 * bbox를 페이지번호 기준으로 필터링
 * @param arr bbox 목록
 * @param pageNum 페이지 번호
 */
const getBoxesForPage = (arr: Bbox[], pageNum: number) => {
  return arr.filter((box) => {
    return box.pageNo === pageNum
  })
}

/**
 * bbox를 실제 화면에 맞게 좌표 변환
 * @param pageNum 페이지 번호
 * @param bbox bbox 포지션
 * @param type layout | group
 */
const getBoxStyle = (
  pageNum: number,
  bbox: { l: number; t: number; r: number; b: number },
  type: 'layout' | 'group',
): CSSProperties => {
  const base = originalPageSizes[pageNum] // PDF 원본 크기
  const cur = pageCssSizes[pageNum] // 화면에 렌더링 된 PDF 크기
  if (!base || !cur) return {}

  const l = (bbox.l * 100).toFixed(2)
  const r = (bbox.r * 100).toFixed(2)
  const t = (bbox.t * 100).toFixed(2)
  const b = (bbox.b * 100).toFixed(2)

  return {
    position: 'absolute' as const,
    left: `${l}%`,
    top: `${t}%`,
    bottom: `${b}%`,
    right: `${r}%`,
    boxSizing: 'border-box',
    backgroundColor:
      type == 'group'
        ? formatRgba(selectedHighlightColor.value.value, 0.25)
        : '',
  }
}

/**
 * bbox에 사용할 컬러를 rgba로 변환
 * @param rgb
 * @param alpha
 */
function formatRgba(rgb: RGB, alpha: number = 1) {
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`
}
provide('formatRgba', formatRgba)

/**
 * 각주 선택
 */
const handleSelectFootnote = () => {
  if (!pdfViewerStore.footnoteType) return
  isShowHighlightBox.value = true

  bboxGroup.value = pdfViewerStore.bboxData.filter(
    (bbox: Bbox) => bbox.id == pdfViewerStore.selectedFootnote?.id,
  )
  if (bboxGroup.value?.length) {
    const findTarget = bboxGroup.value.find(
      (box) => box.id == pdfViewerStore.selectedFootnote?.id,
    )
    if (findTarget) {
      scrollToPage(findTarget.page_no)
    }
  }
}

/**
 * 상태 초기화
 */
const resetState = () => {
  // pdf 객체 제거
  pdfDoc = null

  // 기본 상태값
  numPages.value = 0
  currentPage.value = 1
  scale.value = 1

  // 로딩 상태
  isDocLoaded.value = false
  selectedScale.value = 'pageFit'

  // 페이지별 로딩 플래그 초기화 (있다면)
  if (isPageLoaded) {
    Object.keys(isPageLoaded).forEach((k) => delete isPageLoaded[+k])
  }

  // 캔버스 ref 맵 초기화
  Object.keys(canvasRefs).forEach((k) => delete canvasRefs[+k])

  // 페이지 사이즈 캐시 제거
  Object.keys(originalPageSizes).forEach((k) => delete originalPageSizes[+k])
  Object.keys(pageCssSizes).forEach((k) => delete pageCssSizes[+k])

  // 컨테이너 스크롤도 맨 위로
  if (pdfContainerRef.value) {
    pdfContainerRef.value.scrollTop = 0
  }
}

/**
 * 마우스휠 줌 이벤트 핸들러
 */
const handleWheel = (e: WheelEvent) => {
  if (!e.ctrlKey) return
  e.preventDefault()
  void onWheelZoom(e)
}
/**
 * 마우스휠 줌 이벤트
 */
const onWheelZoom = async (e: WheelEvent) => {
  const container = pdfContainerRef.value
  if (!container) return

  if (zoomPageNumber === null) {
    zoomPageNumber = currentPage.value
  }

  const page = zoomPageNumber
  const rect = container.getBoundingClientRect()
  const mouseX = e.clientX - rect.left
  const mouseY = e.clientY - rect.top

  const oldScale = scale.value
  const currentPercent = zoomPercent.value

  let nextPercent =
    e.deltaY < 0 ? currentPercent + ZOOM_STEP : currentPercent - ZOOM_STEP

  nextPercent = Math.max(
    ZOOM_MIN_PERCENT,
    Math.min(ZOOM_MAX_PERCENT, nextPercent),
  )

  scale.value = Number((baseScale.value * (nextPercent / 100)).toFixed(4))
  const scaleRatio = scale.value / oldScale
  container.scrollLeft = (container.scrollLeft + mouseX) * scaleRatio - mouseX
  // container.scrollTop = (container.scrollTop + mouseY) * scaleRatio - mouseY
  container.scrollTop = (page - 1) * itemHeight.value - itemHeight.value / 2
  virtualScrollRef.value?.refresh()
  if (currentPage.value !== page) {
    scrollToPage(page, 'center')
  }

  await nextTick()
  virtualScrollRef.value?.refresh()
  clearTimeout(zoomTimer)
  zoomTimer = setTimeout(() => {
    if (Math.abs(currentPage.value - page) >= 2) {
      scrollToPage(page, 'center')
    }
    zoomPageNumber = null
  }, 300)
}
// ===================================================
// 👀 Watchers
// ===================================================
watch(
  () => props.file,
  (newVal) => {
    resetState()
    if (newVal) {
      void loadFile()
    }
  },
  { immediate: true },
)
watch(
  () => pages.value.length,
  async (len) => {
    if (!len || !props.initialPage) return
    await nextTick()
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          scrollToPage(props.initialPage!)
        }, 50)
      })
    })
  },
)
watch(
  () => pdfViewerStore.selectedFootnote,
  (val) => {
    isShowHighlightBox.value = false
    if (val) {
      blinkCounter.value++
      handleSelectFootnote()
    } else {
      blinkCounter.value = 0
    }
  },
)

watch(pages, () => {
  renderedPages.clear()
})

watch(scale, async () => {
  const currentIndex = currentPage.value - 1
  // 기존 렌더 초기화
  renderedPages.clear()
  await nextTick()
  // 가상스크롤 재계산
  virtualScrollRef.value?.refresh()
  // 현재 페이지 유지
  virtualScrollRef.value?.scrollTo(currentIndex, 'start')
  // 현재 보이는 페이지만 다시 렌더
  renderVisiblePages()
})

// ===================================================
// 🚀 Lifecycle Hooks
// ===================================================
onMounted(() => {
  // 뷰어 영역 이벤트 리스너 추가 : 컨트롤 줌
  const el = pdfContainerRef.value
  if (el) {
    el.addEventListener('wheel', handleWheel, { passive: false })
  }
  // 가상스크롤영역 이벤트 리스너 추가
  scrollEl =
    virtualScrollRef.value?.$el.querySelector('.q-virtual-scroll__content')
      ?.parentElement || null
})
onBeforeUnmount(() => {
  // 이벤트 리스너 삭제
  const el = pdfContainerRef.value
  if (el) {
    el.removeEventListener('wheel', handleWheel)
  }
})
</script>

<style lang="scss">
.pdf-viewer {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  &__container {
    height: 100%;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
  }
  // content
  &__content {
    display: flex;
    flex-grow: 1;
    overflow-y: auto;
    height: 100%;
    position: relative;
    background: var(--gray-300);
  }
  .canvas-container {
    flex-grow: 1;
    width: 100%;
    height: 100%;
    overflow: auto;
    display: flex;
    flex-direction: column;
    align-items: safe center;
    background-color: var(--gray-50);
  }
  .q-virtual-scroll__content {
    display: flex;
    flex-direction: column;
    align-items: safe center;
  }
  .pdf-page {
    display: inline-flex;
    justify-content: center;
    &::after {
      content: '';
      position: absolute;
      width: 100%;
      height: 100%;
      border: 1px solid var(--color-border);
    }
  }
  .bbox {
    position: absolute;
    z-index: 1;
    box-sizing: border-box;
    &.is-blink {
      animation: blink-fade 0.8s ease-in-out 4;
    }
    &--group {
      background: rgba(181, 255, 50, 0.2);
      pointer-events: none;
    }
  }
  &__empty {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.3);
    color: var(--color-text-primary);
    z-index: 1;
    @include mixin.flex-center();
    &.is-blur {
      backdrop-filter: blur(4px);
    }
    &.empty-img {
      overflow: hidden;
      border: 1px solid var(--color-border-strong);
      padding: 16px;
      .img-wrap {
        background-color: var(--gray-50);
        width: 100%;
        height: 100%;
        overflow-y: auto;
        img {
          width: 100%;
        }
      }
    }
  }
  &__empty-inner {
    background: var(--color-surface);
    padding: 40px;
    color: var(--color-text-primary);
    @include mixin.flex-center();
    font-size: mixin.rem(16px);
    min-width: 320px;
    min-height: 240px;
    font-weight: 500;
    &.has-error {
      color: var(--text-color-disabled);
    }
  }
  &__empty-icon {
    font-size: mixin.rem(24px);
  }
  &__spinner {
    display: flex;
    align-items: center;
    flex-direction: column;
  }
}
@keyframes blink-fade {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}
</style>
