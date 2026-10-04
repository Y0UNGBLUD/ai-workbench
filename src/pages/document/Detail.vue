<template>
  <q-page class="document-analysis">
    <ResizableGroup class="document-analysis__container">
      <ResizablePanel
        class="document-analysis__viewer"
        :default-size="30"
        :min-size="300">
        <PdfViewer :file="file" hide-collapse />
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel
        class="document-analysis__content"
        :default-size="50"
        :min-size="400">
        <AnalysisResult
          :title="docTitle"
          :hashtags="docHashtags"
          :content="docContent"
          :layout="docLayout"
          :questions="docQuestions"
          @ask="handleSendChat" />
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel
        class="document-analysis__chat"
        :default-size="20"
        :min-size="300">
        <Chat @send="handleSendChat" />
      </ResizablePanel>
    </ResizableGroup>
    <Teleport v-if="isDocumentReady" to="#globalHeaderActions">
      <BaseButton icon="refresh" label="재분석" @click="handleRetry" />
    </Teleport>
  </q-page>
</template>
<script setup lang="ts">
// ===================================================
// 🧠 Vue Core
// ===================================================
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
const route = useRoute()
const router = useRouter()

// ===================================================
// 🧩 Components
// ===================================================
import { QPage } from 'quasar'
import ResizableGroup from '@/components/resizable/ResizableGroup.vue'
import ResizablePanel from '@/components/resizable/ResizablePanel.vue'
import ResizableHandle from '@/components/resizable/ResizableHandle.vue'
import PdfViewer from '@/components/pdfViewer/PdfViewer.vue'
import AnalysisResult from './partials/AnalysisResult.vue'
import Chat from '@/components/chat/Chat.vue'
import BaseButton from '@/components/common/BaseButton.vue'

// ===================================================
// 🌐 API / Server Data
// ===================================================
import {
  getDocumentInfo,
  getDocumentFileBlob,
  requestDocumentAnalysis,
  streamAnalysisDocument,
} from '@/api/document/document.api'
import {
  loadDocumentChatHistory,
  sendDocumentChat,
} from '@/api/document/document.chat.ts'

// ===================================================
// 🪽 Utils / Helpers
// ===================================================
import { notify } from '@/libs/notify'

// ===================================================
// 📐 Types / Interfaces
// ===================================================
import type { StoredDocument } from '@/types/models/document.model'
import type { DocumentAnalysisResponse } from '@/types/api/document.response'
type DocContentType = 'title' | 'hashtags' | 'layout' | 'content' | 'questions'

// ===================================================
// 🪝 Composables / Hooks
// ===================================================
import { useChatStore } from '@/stores/chat.ts'
import { usePdfViewerStore } from '@/stores/pdfViewer.ts'
import { useLoading } from '@/composables/ui/useLoading'
const { withLoading } = useLoading()
const { withLoading: withFileLoading } = useLoading()
const chatStore = useChatStore()
const pdfViewerStore = usePdfViewerStore()

// ===================================================
// 📦 State
// ===================================================
const documentInfo = ref<StoredDocument | null>(null)
const file = ref<null | File>(null)
const docTitle = ref<null | string>(null)
const docHashtags = ref<null | string[]>(null)
const docLayout = ref<null | string[]>(null)
const docContent = ref<null | string>(null)
const docQuestions = ref<null | string[]>(null)
const sessionId = ref<null | number>(null)
const isDocumentReady = ref<boolean>(false)
const isDocumentError = ref<boolean>(false)

// ===================================================
// 🧮 Computed
// ===================================================
const documentId = computed(() => {
  return Array.isArray(route.params.id) ? route.params.id[0] : route.params.id
})

// ===================================================
// 🛠️ Actions
// ===================================================
/**
 * 1. 문서 정보 조회
 */
const fetchInfo = async () => {
  if (!documentId.value) {
    notify({
      message: '문서 조회 실패',
      caption: '문서 정보를 찾을 수 없습니다.',
      color: 'negative',
    })
    return
  }
  const id = documentId.value
  await withLoading(async () => {
    try {
      const res = await getDocumentInfo(id)
      if (!res) throw new Error('문서 정보를 찾을 수 없습니다.')
      documentInfo.value = res
    } catch (err) {
      console.log('에러 발생', err)
    }
    // 파일 다운로드
    await handleFileDownloadSafely()
    // 문서 분석 확인
    await handleDocumentAnalyzeSafely()
  })
}

/**
 * 2. 문서 파일 다운로드
 */
const handleFileDownloadSafely = async () => {
  try {
    if (!documentInfo.value) throw new Error('파일을 찾을 수 없습니다.')
    const fileId = documentInfo.value.fileId
    const filename = documentInfo.value.filename
    await withFileLoading(async () => {
      const res = await getDocumentFileBlob(fileId)
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const pdfFile = new File([blob], filename, { type: 'application/pdf' })
      file.value = pdfFile
    })
  } catch (err) {
    console.error('파일 다운로드 실패:', err)
    notify({
      type: 'negative',
      message: '파일 다운로드 실패',
      caption: 'PDF 문서를 불러오지 못했습니다.',
    })
  }
}
/**
 * 3. 문서 분석정보 조회
 */
const handleDocumentAnalyzeSafely = async (retry: boolean = false) => {
  try {
    if (!documentInfo.value) throw new Error('파일을 찾을 수 없습니다.')
    const fileId = documentInfo.value.fileId
    const res = await requestDocumentAnalysis({
      fileId: fileId,
      retry: retry,
    })
    // 컨텐츠 로드
    loadDocumentAnalysis(res)
    // 분석 상태별 처리
    handleAnalysisStatus(res)
    // 채팅 로드
    handleChatSession(res)
    if (res.status == 'complete') isDocumentReady.value = true
  } catch (err) {
    console.error('문서 분석 요청 실패:', err)
  }
}

/**
 * 3-1. 컨텐츠 로드
 */
const loadDocumentAnalysis = (data: DocumentAnalysisResponse) => {
  loadDocumentContent('title', data.title)
  loadDocumentContent('hashtags', data.hashtags)
  loadDocumentContent('layout', data.layout)
  loadDocumentContent('content', data.content)
  loadDocumentContent('questions', data.questions)
}
/**
 * 3-2. 분석 상태별 처리
 */

const handleAnalysisStatus = async (data: DocumentAnalysisResponse) => {
  if (data.status == 'complete') return
  const isProcessing = data.status == 'progress' || !data.status
  const isFailed = data.status == 'faild' || data.status == 'error'
  const jobId = data.jobId
  const fileId = data.fileId
  if (isProcessing) {
    // sse 연결
    try {
      await streamAnalysisDocument(
        { jobId: jobId, fileId: fileId },
        (chunk, event) => {
          switch (event) {
            case 'title':
            case 'hashtags':
            case 'layout':
            case 'content':
            case 'questions':
              if (chunk.status == 'complete')
                loadDocumentContent(event, chunk.data)
              break
            case 'complete':
              notify({
                message: '문서 분석 완료',
                caption: '문서 분석을 완료했습니다.',
                color: 'positive',
              })
              isDocumentReady.value = true
              break
          }
        },
      )
    } catch (err) {
      console.log('sse 에러 발생', err)
    }
  } else if (isFailed) {
    isDocumentError.value = true
  }
}

/**
 * 3-3. 채팅 로드
 */
const handleChatSession = async (data: DocumentAnalysisResponse) => {
  sessionId.value = data.sessionId
  // #TODO: 채팅 히스토리 로드
  const res = await loadDocumentChatHistory({
    page: 1,
    size: 10,
    sessionId: sessionId.value,
  })
  // console.log('채팅내역 조회결과::', res)
  chatStore.setChatHistory(res.content)
}

/**
 * 채팅 발사
 */
const handleSendChat = async (msg: string) => {
  try {
    if (!sessionId.value) return
    chatStore.sendChat(msg)
    await sendDocumentChat(
      { sessionId: sessionId.value, msg: msg },
      (event) => {
        chatStore.receiveChat(event)
      },
    )
  } catch (err) {
    console.log('채팅 에러 발생', err)
  }
}

const handleRetry = async () => {
  resetDocumentInfo()
  await fetchInfo()
}

// ===================================================
// ⚙️ Methods
// ===================================================

/**
 * 초기화: 변수에 저장된 문서 데이터 초기화
 */
const resetDocumentInfo = () => {
  documentInfo.value = null
  file.value = null
  docTitle.value = null
  docHashtags.value = null
  docLayout.value = null
  docContent.value = null
  docQuestions.value = []
  sessionId.value = null
  isDocumentReady.value = false
  isDocumentError.value = false
  pdfViewerStore.resetAllBboxData()
  chatStore.resetChatState()
}

/**
 * 컨텐츠 로드 메소드
 */
const loadDocumentContent = (
  contentType: DocContentType,
  data: string | string[] | null,
) => {
  if (!data) return
  let contentData = null
  if (Array.isArray(data)) {
    contentData = data
  } else {
    try {
      contentData = JSON.parse(data)
    } catch {
      contentData = data
    }
  }

  switch (contentType) {
    case 'title':
      docTitle.value = contentData
      break
    case 'hashtags':
      docHashtags.value = contentData
      break
    case 'layout':
      docLayout.value = contentData
      pdfViewerStore.setBboxData(contentData)
      break
    case 'content':
      docContent.value = contentData
      break
    case 'questions':
      docQuestions.value = contentData
      break
  }
}

// ===================================================
// 👀 Watchers
// ===================================================
watch(
  () => documentId.value,
  async (val) => {
    if (val) {
      resetDocumentInfo()
      await fetchInfo()
    }
  },
)

// ===================================================
// 🚀 Lifecycle Hooks
// ===================================================
onMounted(async () => {
  await fetchInfo()
})
onUnmounted(() => {
  resetDocumentInfo()
})
</script>
<style lang="scss" scoped>
.document-analysis {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  max-height: 0;
  &__container {
    flex-grow: 1;
    padding: 8px;
  }
  &__viewer {
    flex: 1 1 0;
  }

  &__content {
    flex: 1 1 0;
  }

  &__chat {
    flex: 0 0 360px;
  }
  .resizable-panel {
    border: 2px solid var(--ink);
    background: var(--color-surface);
  }
}
</style>
