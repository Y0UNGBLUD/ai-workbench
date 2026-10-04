import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'
import routes from './routes'

// ===================================================
// ⚙️ Methods
// ===================================================
function checkAuth(to: any, userStore: any) {
  // 1️⃣ public 페이지는 통과
  if (to.meta.public) {
    return true
  }

  // 2️⃣ 로그인 필요 페이지
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    return '/login'
  }

  // 3️⃣ 로그인 상태에서 로그인/회원가입 접근 차단
  if (!to.meta.requiresAuth && userStore.isLoggedIn) {
    return '/'
  }

  return true
}
// ===================================================
// 🪝 동적 라우팅
// ===================================================
const routeLoaders = {
  '/stock': {
    loader: () => import('./userRoutes/stock'),
    layout: 'MainLayout',
  },
  '/document': {
    loader: () => import('./userRoutes/document'),
    layout: 'MainLayout',
  },
}
const loadedModules = new Set<string>()
const sortedEntries = Object.entries(routeLoaders).sort(
  (a, b) => b[0].length - a[0].length,
)
function findRouteEntry(path: string) {
  return sortedEntries.find(([key]) => path.startsWith(key))?.[1]
}
/**
 * Router 생성
 */
const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Router Guard
router.beforeEach(async (to) => {
  const entry = findRouteEntry(to.path)

  if (entry) {
    const basePath = '/' + to.path.split('/')[1]

    if (!loadedModules.has(basePath)) {
      const module = await entry.loader()

      module.default.forEach((route) => {
        router.addRoute(entry.layout, route)
      })

      loadedModules.add(basePath)

      return to.fullPath
    }
  }

  const userStore = useUserStore()

  const authResult = checkAuth(to, userStore)
  if (authResult !== true) {
    return authResult
  }

  // #FIXME:
  //   const permissionResult = checkPermission(to, userStore)
  const permissionResult = true
  if (permissionResult !== true) {
    return permissionResult
  }

  return true
})
router.afterEach((to, from) => {})

export default router
