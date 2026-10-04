import { api, rawApi } from '@/libs/axios'
import { notify } from '@/libs/notify'
import type {
  DocumentListRequest,
  DocumentDeleteRequest,
  DocumentAnalysisRequest,
  DocumentAnalysisStreamRequest,
} from '@/types/api/document.request'
import type {
  DocumentListResponse,
  DocumentDeleteResponse,
  DocumentInfoResponse,
  DocumentAnalysisResponse,
  AnalysisSseChunk,
} from '@/types/api/document.response'
import { createFetchStream } from '@/utils/realtime/fetch'
import { consumeSseStream } from '@/utils/realtime/sse'

/**
 * 파일 업로드
 */
// export async function uploadDocument(params: FormData) {
//   return await api.post<UploadDocumentResponse>(
//     `/ai/aidoc/v1/document/upload`,
//     params,
//     {
//       headers: {
//         'Content-Type': 'multipart/form-data',
//       },
//       timeout: 300000, // 5분
//     },
//   )
// }

/**
 * 파일 다운로드 : 블롭
 */
export async function getDocumentFileBlob(fileId: string) {
  return await rawApi.get<Blob>(`/api/v1/document/file/${fileId}`, {
    responseType: 'blob',
    timeout: 300000,
  })
}
/**
 * 파일 다운로드 : 진짜파일
 */
// export const downloadDocumentFile = async (params: DownloadFileRequest) => {
//   await getDocumentFileBlob(params.document_metadata_id)
//     .then((res) => {
//       const blob = new Blob([res.data], { type: 'application/pdf' })
//       const filename = params.original_filename ?? 'document.pdf'
//       // 다운로드 링크 생성
//       const url = URL.createObjectURL(blob)
//       const link = document.createElement('a')
//       link.href = url
//       link.download = filename
//       // 클릭 트리거
//       document.body.appendChild(link)
//       link.click()
//       // 정리
//       document.body.removeChild(link)
//       URL.revokeObjectURL(url)
//       notify({
//         type: 'positive',
//         message: '파일 다운로드 완료',
//         caption: `${filename}을 다운로드했습니다.`,
//       })
//     })
//     .catch((err) => {
//       notify({
//         type: 'negative',
//         message: '파일 다운로드 실패',
//         caption: 'PDF 문서를 불러오지 못했습니다.',
//       })
//       console.log(err)
//     })
// }

/**
 * 문서 목록 조회
 */
export async function getDocumentList(params: DocumentListRequest) {
  return await api.get<DocumentListResponse>(`/api/v1/document/list`, {
    params: {
      ...params,
    },
  })
}
/**
 * 문서 삭제
 */
export async function deleteDocument(params: DocumentDeleteRequest) {
  return await api.delete<DocumentDeleteResponse>(`/api/v1/document/delete`, {
    params: {
      ...params,
    },
  })
}

/**
 * 문서 정보 상세 조회
 */
export async function getDocumentInfo(documentId: string) {
  return await api.get<DocumentInfoResponse>(
    `/api/v1/document/meta/${documentId}`,
    {
      params: {
        documentId: documentId,
      },
    },
  )
}

/**
 * 문서 분석 요청
 */
export async function requestDocumentAnalysis(params: DocumentAnalysisRequest) {
  return await api.post<DocumentAnalysisResponse>(
    `/api/v1/document/analysis`,
    params,
  )
}

/**
 * 문서 분석 sse
 */

export async function streamAnalysisDocument(
  params: DocumentAnalysisStreamRequest,
  onEvent: (data: AnalysisSseChunk, event: string) => void,
) {
  const fetchStream = createFetchStream()
  const controller = new AbortController()
  const res = await fetchStream(`/api/v1/document/stream`, {
    method: 'POST',
    body: JSON.stringify(params),
    signal: controller.signal,
  })

  await consumeSseStream(res, onEvent, controller)
}
