<template>
  <div class="pdf-viewer__toolbar">
    <div class="pdf-viewer__toolbar-left">
      <BaseButton
        label="메뉴 더보기"
        a11y
        icon="auto_stories"
        color="transparent"
        dense
        class="pdf-viewer__sidebar-toggle"
        :disable="!!disabled"
        @click="toggleSidebar" />
      <div class="pdf-viewer__page-controls">
        <BaseButton
          label="이전 페이지"
          a11y
          icon="chevron_left"
          color="transparent"
          dense
          @click="$emit('page-prev')"
          :disabled="!!disabled"
          class="pdf-viewer__page-prev pdf-viewer__page-control" />
        <span class="pdf-viewer__page-total"
          ><strong>{{ currentPage }}</strong
          ><span class="slash">/</span> {{ totalPage }}</span
        >
        <BaseButton
          label="다음 페이지"
          a11y
          icon="chevron_right"
          color="transparent"
          dense
          @click="$emit('page-next')"
          :disabled="!!disabled"
          class="pdf-viewer__page-next pdf-viewer__page-control" />
      </div>
    </div>
    <div class="pdf-viewer__toolbar-right">
      <!-- highlight color -->
      <BaseButton
        v-if="!hideHighlight"
        label="형광펜"
        a11y
        color="transparent"
        dense
        class="pdf-viewer__highlight-color"
        :class="{ 'is-active': isShowHighlightColorPanel }"
        @click="isShowHighlightColorPanel = !isShowHighlightColorPanel">
        <q-icon name="palette" size="24px" />
        <span
          class="pdf-viewer__highlight-color-view"
          :style="{
            marginLeft: `8px`,
            backgroundColor: formatRgba(selectedHighlightColor.value, 1),
          }">
          <span class="a11y">{{ selectedHighlightColor.name }}</span>
        </span>
      </BaseButton>
      <div
        v-if="isShowHighlightColorPanel"
        class="pdf-viewer__highlight-color-panel">
        <button
          v-for="(item, index) in highlightColorOptions"
          :key="index"
          :style="{ backgroundColor: formatRgba(item.value, 1) }"
          @click="changeHighlightColor(item)"
          class="pdf-viewer__highlight-color-panel-item"
          :class="{
            'is-selected': selectedHighlightColor.name == item.name,
          }">
          {{ item.name }}
        </button>
      </div>
      <!-- zoom -->
      <div class="pdf-viewer__zoom-controls">
        <BaseButton
          label="줌아웃"
          a11y
          icon="remove"
          color="transparent"
          dense
          class="pdf-viewer__zoom-out"
          @click="emit('zoom-out')"
          :disabled="!!disabled" />
        <span
          class="pdf-viewer__zoom-percent"
          :class="{ 'text-400': !!disabled }">
          {{ zoomPercent }} %</span
        >
        <BaseButton
          label="줌인"
          a11y
          icon="add"
          dense
          color="transparent"
          class="pdf-viewer__zoom-in"
          @click="$emit('zoom-in')"
          :disabled="!!disabled" />
      </div>
      <!-- collapse -->
      <BaseButton
        v-if="!hideCollapse"
        label="토글"
        a11y
        icon="first_page"
        color="transparent"
        dense
        class="pdf-viewer__toggle"
        :disabled="!!disabled"
        @click="$emit('collapse')" />
    </div>
  </div>
</template>
<script setup lang="ts">
// ===================================================
// 📦 Imports
// ===================================================
import { ref, onMounted, inject, nextTick } from 'vue'
import { QBtn, QIcon } from 'quasar'
import BaseButton from '@/components/common/BaseButton.vue'

// ===================================================
// 📐 Types / Interfaces
// ===================================================
import type { RGB, HighlightColor } from '@/types/components/pdfViewer'

// ===================================================
// 📥 Props / Emits
// ===================================================
const props = defineProps<{
  disabled?: boolean
  hideHighlight?: boolean
  hideCollapse?: boolean
  currentPage: number
  totalPage: number
  zoomPercent: number
}>()
const emit = defineEmits<{
  (e: 'collapse'): void
  (e: 'page-prev'): void
  (e: 'page-next'): void
  (e: 'zoom-in'): void
  (e: 'zoom-out'): void
}>()

// ===================================================
// 📦 State : defineModel
// ===================================================
const isShowSidebar = defineModel('isShowSidebar', {
  default: false,
  type: Boolean,
})
const selectedHighlightColor = defineModel<HighlightColor>(
  'selectedHighlightColor',
  {
    required: true,
  },
)

// ===================================================
// 📦 State
// ===================================================
const isShowHighlightColorPanel = ref(false)
const highlightColorOptions: HighlightColor[] = [
  { name: 'coral', value: [255, 112, 88] },
  { name: 'lime', value: [181, 255, 50] },
  { name: 'blue', value: [109, 121, 246] },
  { name: 'green', value: [12, 113, 87] },
]

// ===================================================
// ⚙️ Methods
// ===================================================
/**
 * rgb값을 rgba 형식으로 변환
 */
const formatRgba = inject<(rgb: RGB, alpha: number) => string>(
  'formatRgba',
  (rgb, alpha = 1) => `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`,
)
/**
 * 썸네일 사이드바 토글
 */
const toggleSidebar = () => {
  isShowSidebar.value = !isShowSidebar.value
}

/**
 * 하이라이트 컬러 변경
 * @param item - HighlightColor
 */
const changeHighlightColor = (item: HighlightColor) => {
  selectedHighlightColor.value = item
  isShowHighlightColorPanel.value = false
  document.documentElement.style.setProperty(
    '--viewer-highlight-color',
    String(item.value),
  )
  localStorage.setItem('viewerHighlightColor', JSON.stringify(item))
}

// ===================================================
// 🚀 Lifecycle Hooks
// ===================================================
onMounted(async () => {
  const savedColor = localStorage.getItem('viewerHighlightColor')
  if (savedColor) {
    try {
      selectedHighlightColor.value = JSON.parse(savedColor)
      await nextTick()
      void changeHighlightColor(selectedHighlightColor.value)
    } catch (e) {
      console.warn('Invalid localStorage data for selectedHighlightColor', e)
    }
  }
})
</script>
<style lang="scss" scoped>
.pdf-viewer {
  &__toolbar {
    display: flex;
    justify-content: space-between;
    flex-basis: 0;
    border-bottom: 1px solid var(--ink);
    padding: 0 12px;
    &-left {
      display: flex;
      align-items: center;
    }
    &-right {
      display: flex;
      position: relative;
      align-items: center;
    }
  }
  // toolbar
  &__sidebar-toggle {
    margin-right: 8px;
  }
  &__page-controls {
    display: flex;
    align-items: center;
    padding: 8px 12px;
  }
  &__page-total {
    margin: 0 4px;
    color: var(--color-text-primary);
    display: inline-flex;
    align-items: center;
    font-size: mixin.rem(12px);
    font-weight: 500;
    strong {
      font-weight: 700;
    }
    .slash {
      margin: 0 4px;
    }
  }
  &__page-next {
  }
  // highlight
  &__highlight-color {
    border: 1px solid transparent;
    padding: 4px 8px;
    margin-right: 8px;
    display: flex;
    flex-wrap: nowrap;
    :deep(.q-btn__content) {
      flex-wrap: nowrap;
    }
    &.is-active {
      border: 1px solid var(--ink);
    }
  }
  &__highlight-color-view {
    display: inline-block;
    background: gray;
    font-size: 0;
    border-radius: 4px;
    width: 12px;
    height: 12px;
  }
  &__highlight-color-panel {
    position: absolute;
    top: 90%;
    z-index: 2;
    border: 1px solid var(--ink);
    background: var(--color-surface);
    display: flex;
    padding: 8px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
    > button {
      @include mixin.button-reset();
      font-size: 0;
      width: 24px;
      height: 24px;
      &:not(:last-child) {
        margin-right: 4px;
      }
      &.is-selected {
        border: 3px solid rgba(0, 0, 0, 0.4);
      }
    }
  }
  // zoom
  &__zoom-controls {
    display: flex;
    align-items: center;
  }
  &__zoom-percent {
    color: var(--color-text-primary);
    padding: 0 4px;
    font-weight: 500;
    white-space: nowrap;
  }
  &__toggle {
    margin-left: 12px;
  }
}
</style>
