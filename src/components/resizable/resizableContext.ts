import type { InjectionKey, Ref } from 'vue'

export interface ResizablePanelState {
  id: string
  element: HTMLElement | null
  size: number
  minSize: number
}

export interface ResizableContext {
  groupRef: Ref<HTMLElement | null>
  panels: Ref<ResizablePanelState[]>

  registerPanel: (
    id: string,
    element: HTMLElement,
    size: number,
    minSize: number,
  ) => void

  unregisterPanel: (id: string) => void

  getPanelByElement: (
    element: Element | null,
  ) => ResizablePanelState | undefined

  updatePanelSize: (id: string, size: number) => void

  getPanelAreaWidth: () => number
}
export const RESIZABLE_CONTEXT: InjectionKey<ResizableContext> =
  Symbol('resizable')
