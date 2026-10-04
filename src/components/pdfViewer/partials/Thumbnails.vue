<template>
  <div class="pdf-viewer__sidebar">
    <div
      class="pdf-viewer__thumbnails"
      style="width: 100%; height: 100%; overflow: auto">
      <q-virtual-scroll
        ref="virtualScrollRef"
        :items="pages"
        :virtual-scroll-item-size="thumbnailHeight"
        :virtual-scroll-slice-size="20"
        v-slot="{ index, item }"
        @virtual-scroll="onThumbVirtualScroll"
        style="width: 100%; height: 100%; overflow: auto; background:">
        <div
          class="pdf-viewer__thumbnail"
          :class="{ 'is-active': currentPage === item }"
          @click="$emit('select', index + 1)"
          :key="item"
          style="background: #ccc; border-radius: 8px">
          <canvas :key="item" :ref="(el) => setThumbRef(el, item)" />
          <span class="pdf-viewer__thumbnail-num">
            {{ index + 1 }}
          </span>
          <div
            v-if="
              pageRenderState[item] === 'rendering' ||
              pageRenderState[item] === 'idle'
            "
            class="page-overlay"
            style="
              position: absolute;
              z-index: 1;
              left: 0;
              top: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: auto;
              width: 100%;
              height: 100%;
            ">
            <q-spinner size="30px" />
          </div>
        </div>
      </q-virtual-scroll>
    </div>
  </div>
</template>
<script setup lang="ts">
// ===================================================
// 📦 Imports
// ===================================================
import { ref, reactive, nextTick, watch } from 'vue'
import { QVirtualScroll, QSpinner } from 'quasar'
import type { ComponentPublicInstance } from 'vue'
import type { PDFDocumentProxy } from 'pdfjs-dist'

// ===================================================
// 📥 Props / Emits
// ===================================================
const props = defineProps<{
  pdfDoc: PDFDocumentProxy | null
  pages: number[]
}>()

const emit = defineEmits<{
  (e: 'select', index: number): void
}>()

// ===================================================
// 📦 State
// ===================================================
const THUMBNAIL_SCALE = 0.25
const currentPage = defineModel('currentPage', {
  default: 1,
})
const thumbRefs: Record<number, HTMLCanvasElement | null> = {}
const thumbnailHeight = ref(100)
const isThumbScrolling = ref(false)
let thumbScrollTimer: ReturnType<typeof setTimeout>

const thumbVisibleRange = ref({ from: 0, to: 0 })

const thumbQueue: number[] = []
let thumbRendering = false

const renderedThumbs = new Set<number>()
const pageRenderState = reactive<Record<number, 'idle' | 'rendering' | 'done'>>(
  {},
)
const renderedPages = new Set<number>()

// ===================================================
// 🛠️ Actions
// ===================================================

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
 */
function onThumbVirtualScroll(info: { from: number; to: number }) {
  isThumbScrolling.value = true
  thumbVisibleRange.value = {
    from: info.from,
    to: info.to,
  }
  clearTimeout(thumbScrollTimer)
  thumbScrollTimer = setTimeout(() => {
    isThumbScrolling.value = false
    thumbQueue.length = 0 // 오래된 요청 삭제
    renderVisibleThumbs()
  }, 150)
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
function setThumbRef(
  el: Element | ComponentPublicInstance | null,
  pageNum: number,
) {
  if (!(el instanceof HTMLCanvasElement)) return

  thumbRefs[pageNum] = el
  renderedPages.delete(pageNum) // 재사용 대비

  if (!pageRenderState[pageNum]) {
    pageRenderState[pageNum] = 'idle'
  }
  void enqueueThumb(pageNum)
}

/**
 * 썸네일 렌더링을 큐에 등록한다.
 *
 * VirtualScroll 환경에서 캔버스가 DOM에 생성된 이후 렌더링이 가능하기 때문에
 * nextTick 이후에 큐에 페이지를 추가한다.
 *
 * 이미 렌더링된 페이지는 중복 렌더링을 방지하기 위해 큐에 넣지 않는다.
 *
 * @param pageNum - 렌더링할 PDF 페이지 번호 (1-base)
 * @returns Promise<void>
 */
async function enqueueThumb(pageNum: number) {
  await nextTick()
  if (renderedThumbs.has(pageNum)) return
  thumbQueue.push(pageNum)
  void processThumbQueue()
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
async function processThumbQueue() {
  if (thumbRendering || thumbQueue.length === 0) return
  thumbRendering = true
  const pageNum = thumbQueue.shift()!
  await renderThumbnail(pageNum)
  renderedPages.add(pageNum)
  thumbRendering = false
  void processThumbQueue()
}

/**
 * 실제 PDF 페이지를 Canvas에 렌더링한다.
 * 렌더 상태는 pageRenderState로 관리된다.
 *
 * @param i - 렌더링할 PDF 페이지 번호 (1-base)
 * @returns Promise<void>
 */
async function renderThumbnail(i: number) {
  if (!props.pdfDoc) return
  const canvas = thumbRefs[i]
  if (!canvas) return
  // 이미 완료됐으면 스킵
  if (canvas.dataset.page === String(i)) {
    pageRenderState[i] = 'done'
    return
  }

  pageRenderState[i] = 'rendering' // 렌더 시작
  await nextTick()
  const page = await props.pdfDoc.getPage(i)

  const viewport = page.getViewport({
    scale: THUMBNAIL_SCALE,
    rotation: page.rotate,
  })

  const ctx = canvas.getContext('2d')!

  canvas.width = viewport.width
  canvas.height = viewport.height

  await page.render({
    canvas,
    canvasContext: ctx,
    viewport,
  }).promise
  canvas.dataset.page = String(i)
  pageRenderState[i] = 'done' // 렌더 완료
}

/**
 * 썸네일의 기본 페이지 크기를 초기화한다.
 * @returns Promise<void>
 */
async function initThumbnailSize() {
  if (!props.pdfDoc) return
  const page = await props.pdfDoc.getPage(1)
  const viewport = page.getViewport({
    scale: THUMBNAIL_SCALE,
    rotation: page.rotate,
  })
  thumbnailHeight.value = viewport.height + 24
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
function renderVisibleThumbs() {
  const { from, to } = thumbVisibleRange.value

  const buffer = 10
  const start = Math.max(0, from - buffer)
  const end = Math.min(props.pages.length - 1, to + buffer)

  for (let i = start; i <= end; i++) {
    const pageNum = props.pages[i]
    if (pageNum && !renderedThumbs.has(pageNum)) {
      void enqueueThumb(pageNum)
    }
  }
}

// ===================================================
// ⚙️ Methods
// ===================================================
/**
 * 상태 초기화
 */
function resetState() {
  // 스크롤 타이머 정리
  clearTimeout(thumbScrollTimer)
  isThumbScrolling.value = false

  // 가시 범위 초기화
  thumbVisibleRange.value = { from: 0, to: 0 }

  // 큐 초기화
  thumbQueue.length = 0
  thumbRendering = false

  // 렌더 완료 캐시 초기화
  renderedThumbs.clear()
  renderedPages.clear()

  // 페이지 렌더 상태 초기화
  Object.keys(pageRenderState).forEach((key) => {
    delete pageRenderState[Number(key)]
  })

  // canvas ref 초기화 + dataset 정리
  Object.keys(thumbRefs).forEach((key) => {
    const pageNum = Number(key)
    const canvas = thumbRefs[pageNum]

    if (canvas) {
      canvas.width = 0
      canvas.height = 0
      canvas.removeAttribute('data-page')
    }

    delete thumbRefs[pageNum]
  })
}

// ===================================================
// 👀 Watchers
// ===================================================
watch(
  () => props.pdfDoc,
  async (val) => {
    if (!val) return
    // 이전 PDF 정리
    resetState()
    await nextTick()
    // 새 PDF 기준 썸네일 높이 재계산
    await initThumbnailSize()
    // 첫 화면 렌더 트리거
    renderVisibleThumbs()
  },
)
</script>
<style lang="scss" scoped>
.pdf-viewer__sidebar {
  height: 100%;
  flex-shrink: 0;
  width: 120px;
  overflow: auto;
  background: var(--color-surface);
  position: absolute;
  z-index: 3;
  top: 0;
  left: 0;
  border-right: 1px solid var(--ink);
  ::-webkit-scrollbar-button {
    display: none;
  }
  .q-virtual-scroll {
    padding: 20px 0;
  }
  .pdf-viewer__thumbnail {
    position: relative;
    margin: 0 16px 40px;
    padding: 1px;
    cursor: pointer;
    text-align: center;
    position: relative;
    display: flex;
    min-height: 100px;
    &::after {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      border: 1px solid var(--color-border-strong);
    }
    &.is-active::after {
      border-color: var(--color-secondary);
      border-width: 2px;
    }
    canvas {
      width: 100%;
    }
    &-num {
      position: absolute;
      bottom: -24px;
      font-size: 12px;
      color: var(--color-text-primary);
      text-align: center;
      width: 100%;
      font-weight: 500;
    }
  }
}
</style>
