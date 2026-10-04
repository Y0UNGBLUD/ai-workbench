import { exampleHandlers } from './example.handler'
import { authHandlers } from './auth.handler'
import { documentHandlers } from './document.handler'
export const handlers = [
  ...exampleHandlers,
  ...authHandlers,
  ...documentHandlers,
]
