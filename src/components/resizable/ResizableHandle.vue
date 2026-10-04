<script setup lang="ts">
import { inject, onBeforeUnmount, ref } from 'vue'
import { RESIZABLE_CONTEXT } from './resizableContext'

const context = inject(RESIZABLE_CONTEXT)

if (!context) {
  throw new Error('ResizableHandle must be used inside ResizableGroup.')
}

const dragging = ref(false)

let startX = 0
let leftStartSize = 0
let rightStartSize = 0

let leftPanelId = ''
let rightPanelId = ''

const onMouseMove = (event: MouseEvent) => {
  if (!dragging.value) return

  const panelAreaWidth = context.getPanelAreaWidth()

  if (!panelAreaWidth) return

  const delta = event.clientX - startX
  const deltaPercent = (delta / panelAreaWidth) * 100

  const leftPanel = context.panels.value.find(
    (panel) => panel.id === leftPanelId,
  )

  const rightPanel = context.panels.value.find(
    (panel) => panel.id === rightPanelId,
  )

  if (!leftPanel || !rightPanel) return

  const leftMinPercent = (leftPanel.minSize / panelAreaWidth) * 100

  const rightMinPercent = (rightPanel.minSize / panelAreaWidth) * 100

  const maxLeftSize = leftStartSize + (rightStartSize - rightMinPercent)

  const minLeftSize = leftMinPercent

  const leftSize = Math.min(
    maxLeftSize,
    Math.max(minLeftSize, leftStartSize + deltaPercent),
  )

  const rightSize = leftStartSize + rightStartSize - leftSize

  context.updatePanelSize(leftPanelId, leftSize)

  context.updatePanelSize(rightPanelId, rightSize)
}

const onMouseUp = () => {
  dragging.value = false

  window.removeEventListener('mousemove', onMouseMove)

  window.removeEventListener('mouseup', onMouseUp)
}

const onMouseDown = (event: MouseEvent) => {
  const handle = event.currentTarget as HTMLElement

  const leftElement = handle.previousElementSibling

  const rightElement = handle.nextElementSibling

  const leftPanel = context.getPanelByElement(leftElement)

  const rightPanel = context.getPanelByElement(rightElement)

  if (!leftPanel || !rightPanel) return

  startX = event.clientX

  leftStartSize = leftPanel.size
  rightStartSize = rightPanel.size

  leftPanelId = leftPanel.id
  rightPanelId = rightPanel.id

  dragging.value = true

  window.addEventListener('mousemove', onMouseMove)

  window.addEventListener('mouseup', onMouseUp)
}

onBeforeUnmount(onMouseUp)
</script>

<template>
  <div
    data-resizable-handle
    class="resizable-handle"
    :class="{
      'is-dragging': dragging,
    }"
    @mousedown="onMouseDown" />
</template>

<style scoped lang="scss">
.resizable-handle {
  flex: 0 0 6px;
  width: 6px;
  cursor: col-resize;
  user-select: none;

  &:hover,
  &.is-dragging {
    background: rgba(0, 0, 0, 0.1);
  }
}
</style>
