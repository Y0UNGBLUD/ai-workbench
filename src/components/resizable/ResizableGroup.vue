<script setup lang="ts">
import { provide, ref } from 'vue'
import {
  RESIZABLE_CONTEXT,
  type ResizableContext,
  type ResizablePanelState,
} from './resizableContext'

const groupRef = ref<HTMLElement | null>(null)
const panels = ref<ResizablePanelState[]>([])

const registerPanel = (
  id: string,
  element: HTMLElement,
  size: number,
  minSize: number,
) => {
  panels.value.push({
    id,
    element,
    size,
    minSize,
  })
}

const unregisterPanel = (id: string) => {
  panels.value = panels.value.filter((panel) => panel.id !== id)
}

const getPanelByElement = (element: Element | null) => {
  if (!element) return undefined

  return panels.value.find((panel) => panel.element === element)
}

const updatePanelSize = (id: string, size: number) => {
  const panel = panels.value.find((panel) => panel.id === id)

  if (panel) {
    panel.size = size
  }
}

const getPanelAreaWidth = () => {
  const group = groupRef.value

  if (!group) return 0

  const handleWidth = Array.from(
    group.querySelectorAll<HTMLElement>('[data-resizable-handle]'),
  ).reduce((width, handle) => {
    return width + handle.offsetWidth
  }, 0)

  return group.clientWidth - handleWidth
}

const context: ResizableContext = {
  groupRef,
  panels,
  registerPanel,
  unregisterPanel,
  getPanelByElement,
  updatePanelSize,
  getPanelAreaWidth,
}

provide(RESIZABLE_CONTEXT, context)
</script>

<template>
  <div ref="groupRef" class="resizable-group">
    <slot />
  </div>
</template>

<style scoped lang="scss">
.resizable-group {
  display: flex;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}
</style>
