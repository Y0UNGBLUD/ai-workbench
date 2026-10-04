import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Bbox, Footnote } from '@/types/components/pdfViewer'

type FootnoteType = 'content' | 'chat' | null
export const usePdfViewerStore = defineStore('pdfViewer', () => {
  // ===================================================
  // 📦 State
  // ===================================================
  const bboxData = ref<Bbox[]>([])
  const selectedFootnote = ref<Footnote | null>(null)
  const footnoteType = ref<FootnoteType>(null)
  // ===================================================
  // ⚙️ Methods
  // ===================================================
  function setBboxData(arr: Bbox[]) {
    bboxData.value = arr
  }
  function clearBboxData() {
    bboxData.value = []
  }
  function selectFootnote(footnote: Footnote, type: FootnoteType) {
    selectedFootnote.value = footnote
    footnoteType.value = type
  }
  function clearFootnote() {
    selectedFootnote.value = null
    footnoteType.value = null
  }

  function resetAllBboxData() {
    clearBboxData()
    clearFootnote()
  }
  return {
    bboxData,
    selectedFootnote,
    footnoteType,
    setBboxData,
    clearBboxData,
    selectFootnote,
    clearFootnote,
    resetAllBboxData,
  }
})
