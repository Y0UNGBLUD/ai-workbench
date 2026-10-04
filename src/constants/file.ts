export const IMAGE_FILE_ACCEPT = ['.png', '.jpg', '.jpeg', '.webp']
export const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp']
export const FILE_ACCEPT = [
  '.pdf',
  '.docx',
  '.xlsx',
  '.csv',
  ...IMAGE_FILE_ACCEPT,
]
export const DOC_FILE_ACCEPT = ['.pdf', ...IMAGE_FILE_ACCEPT]

export const ADMIN_KB_FILE_ACCEPT = ['.pdf', '.xlsx']

export const MIME_MAP: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  txt: 'text/plain',
  csv: 'text/csv',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  zip: 'application/zip',
}
