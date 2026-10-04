// import { Dark } from 'quasar'
import { useUserStore } from '@/stores/user'
// import { useUIStore } from './stores/ui'

export async function initializeApp() {
  const userStore = useUserStore()

  await userStore.loadFromCookies()

  //   const uiStore = useUIStore()
  //   uiStore.loadTheme()

  //   if (uiStore.theme) {
  //     Dark.set(uiStore.theme === 'dark')
  //   } else {
  //     Dark.set(false)
  //   }
}
