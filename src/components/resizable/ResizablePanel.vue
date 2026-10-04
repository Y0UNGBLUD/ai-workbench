<script setup lang="ts">
import { inject, onBeforeUnmount, onMounted, ref } from 'vue'
import { RESIZABLE_CONTEXT } from './resizableContext'

const props = withDefaults(
  defineProps<{
    defaultSize?: number
    minSize?: number
  }>(),
  {
    defaultSize: 50,
    minSize: 100,
  },
)

const context = inject(RESIZABLE_CONTEXT)

if (!context) {
  throw new Error('ResizablePanel must be used inside ResizableGroup.')
}

const panelRef = ref<HTMLElement | null>(null)
const id = crypto.randomUUID()

onMounted(() => {
  if (!panelRef.value) return

  context.registerPanel(id, panelRef.value, props.defaultSize, props.minSize)
})

onBeforeUnmount(() => {
  context.unregisterPanel(id)
})
</script>

<template>
  <div
    ref="panelRef"
    class="resizable-panel"
    :style="{
      flexBasis: `${context.panels.value.find((panel) => panel.id === id)?.size ?? props.defaultSize}%`,
    }">
    <slot />
  </div>
</template>

<style scoped lang="scss">
.resizable-panel {
  flex: 0 0 auto;
  min-width: 0;
  min-height: 0;
  overflow: auto;
}
</style>
