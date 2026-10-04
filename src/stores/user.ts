import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Team, User } from '@/types/models/user.model'
import type { ValidateResponse, Permission } from '@/types/api/auth.response'
import { getUserInfo, refreshTokenOnce } from '@/api/common/auth.api'
import Cookies from 'universal-cookie'
const cookies = new Cookies()
const TOKEN_COOKIE_KEY = 'accessToken'
// const USER_COOKIE_KEY = 'auth_user'

export const useUserStore = defineStore('user', () => {
  // ===================================================
  // 📦 State
  // ===================================================
  const token = ref<string | null>(null)
  const user = ref<User | null>(null)
  const userPermission = ref<Permission[]>([])
  const teams = ref<Team[]>([])
  // ===================================================
  // 🧮 Getters
  // ===================================================
  const isLoggedIn = computed(() => !!token.value)
  const userId = computed(() => user.value?.id || 0)
  const userName = computed(() => user.value?.username || '')
  const userEmail = computed(() => user.value?.email || '')
  const userTeamId = computed(() => user.value?.teamId || 0)
  // 권한 관리
  const userRoles = computed(() => user.value?.roles || [])
  const hasRole = (roleId: number) =>
    user.value?.roles?.some((role) => role.id === roleId) || false
  const isSuperAdmin = computed(() =>
    userPermission.value.some((p) => p.grantedThroughRole === 'SUPER_ADMIN'),
  )
  const isAdmin = computed(
    () =>
      userPermission.value.some((p) => p.grantedThroughRole === 'ADMIN') ||
      isSuperAdmin.value,
  )
  const guestServices = computed(() =>
    userPermission.value
      .filter((r) => r.grantedThroughRole.endsWith('_GUEST'))
      .map((r) => r.grantedThroughRole.replace(/_GUEST$/, '')),
  )
  const isGuest = computed(() => guestServices.value.length > 0)
  const allowedServiceKeys = computed(() => {
    return new Set(userPermission.value.map((p) => p.domain))
  })
  // ===================================================
  // 🛠️ Actions
  // ===================================================
  function login(newToken: string, userData: User) {
    token.value = newToken
    user.value = userData

    cookies.set(TOKEN_COOKIE_KEY, newToken, { path: '/', sameSite: 'strict' })
  }

  function logout() {
    token.value = null
    user.value = null
    userPermission.value = []
    cookies.remove(TOKEN_COOKIE_KEY, { path: '/' })
  }

  const loadFromCookies = async () => {
    const cookieToken = cookies.get(TOKEN_COOKIE_KEY)
    if (cookieToken) {
      try {
        token.value = cookieToken
        await handleGetUserInfo()
      } catch (err) {
        logout()
      }
    }
  }

  function updateAccessToken(newToken: string) {
    token.value = newToken
    cookies.set(TOKEN_COOKIE_KEY, newToken, { path: '/', sameSite: 'strict' })
  }

  const refreshToken = async () => {
    try {
      const newAccessToken = await refreshTokenOnce()

      cookies.set('accessToken', newAccessToken, { path: '/' })
      token.value = newAccessToken

      return newAccessToken
    } catch (err) {
      console.log('토큰 갱신 실패: ', err)
      throw err
    }
  }

  const handleGetUserInfo = async () => {
    await getUserInfo().then((res) => {
      user.value = res.user
      userPermission.value = res.permissions
    })
  }

  // ===================================================
  // ⚙️ Methods
  // ===================================================
  const canAccessService = (serviceKey?: string): boolean => {
    if (!serviceKey) return true

    // 관리자 → 모든 서비스 허용
    if (isAdmin.value) return true

    // 게스트 → 허용된 서비스만
    if (isGuest.value) {
      return guestServices.value.includes(serviceKey)
    }

    // 일반 유저 → 허용
    return true
  }

  return {
    // state
    token,
    user,
    teams,
    // getters
    isLoggedIn,
    userId,
    userName,
    userEmail,
    userTeamId,
    userRoles,
    userPermission,
    hasRole,
    isAdmin,
    isSuperAdmin,
    isGuest,
    guestServices,
    allowedServiceKeys,
    // actions
    login,
    logout,
    loadFromCookies,
    updateAccessToken,
    refreshToken,
    handleGetUserInfo,
    canAccessService,
  }
})
