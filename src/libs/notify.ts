import { Notify, type QNotifyCreateOptions } from 'quasar'

const defaultOptions: QNotifyCreateOptions = {
  position: 'bottom-right',
  timeout: 5000,
  progress: true,
  actions: [{ icon: 'close', color: 'white', round: true }],
}

export function notify(options: QNotifyCreateOptions) {
  return Notify.create({
    ...defaultOptions,
    ...options,
  })
}
