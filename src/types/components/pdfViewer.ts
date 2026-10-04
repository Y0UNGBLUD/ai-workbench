/**
 * PDF 뷰어 - 하이라이트 컬러
 */
export type RGB = readonly [number, number, number]
export const highlightColorOptions = [
  { name: 'coral', value: [255, 112, 88] },
  { name: 'lime', value: [181, 255, 50] },
  { name: 'blue', value: [109, 121, 246] },
  { name: 'green', value: [12, 113, 87] },
] as const

export type HighlightColor = (typeof highlightColorOptions)[number]

/**
 * PDF 뷰어 - Bbox
 */
export type BboxPosition = {
  t: number
  r: number
  b: number
  l: number
}

export type Bbox = {
  id: string
  keyId?: string
  pageNo: number
  bbox: BboxPosition
  content?: string
}

/**
 * PDF 뷰어 - 각주
 */
export interface Footnote {
  id: string
  number: number
}
