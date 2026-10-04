<template>
  <q-drawer
    v-model="uiStore.isLNBOpen"
    show-if-above
    :width="200"
    side="left"
    bordered
    class="sidebar">
    <div class="sidebar__header">
      <div class="sidebar__logo">
        <q-icon name="fitbit" />
      </div>
      <h1 class="sidebar__title">Ai Workbench</h1>
    </div>
    <div class="sidebar__content">
      <nav class="sidebar__nav">
        <ul class="sidebar__nav-list">
          <li
            v-for="(link, index) in links"
            :key="index"
            class="sidebar__nav-item">
            <router-link
              :to="link.to"
              class="sidebar__nav-link"
              :class="{ 'is-active': isActiveLink(link.to) }">
              <q-icon :name="link.icon" class="sidebar__nav-icon" />
              <span class="sidebar__nav-label"> {{ link.label }}</span>
            </router-link>
          </li>
        </ul>
      </nav>
    </div>

    <div class="sidebar__footer">
      <div class="sidebar__user">
        <div class="sidebar__user-info">
          <span class="sidebar__user-name"
            ><strong>{{ userStore.user?.name }}</strong> 님</span
          >
          <span class="sidebar__user-email">user@email.com</span>
        </div>
        <div class="sidebar__user-actions">
          <BaseButton
            label="로그아웃"
            icon="logout"
            color="transparent"
            text-color="grey"
            :use-tooltip="true"
            size="sm"
            a11y
            round
            @click="showDialog('logoutConfirm')" />
        </div>
      </div>
      <div class="sidebar__upgrade">
        <BaseButton color="primary" class="sidebar__upgrade-btn"
          >업그레이드</BaseButton
        >
      </div>
    </div>
  </q-drawer>
  <!-- modal -->
  <Confirm
    title="로그아웃"
    v-model="dialogs['logoutConfirm']"
    cancelLabel="아니요"
    @confirm="handleLogout"
    class="base-modal__only-text"
    size="sm">
    <p>로그아웃을 진행 하시겠습니까?</p>
  </Confirm>
</template>
<script setup lang="ts">
// ===================================================
// 📦 Imports
// ===================================================
import { QDrawer, QList, QItem, QItemSection, QIcon, QBtn } from 'quasar'
import { useRoute, useRouter } from 'vue-router'
import Confirm from '@/components/dialog/Confirm.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import { logout } from '@/api/common/auth.api'
const route = useRoute()
const router = useRouter()

// ===================================================
// 🪝 Composables / Hooks
// ===================================================
import { useDialog } from '@/composables/ui/useDialog'
import { useUiStore } from '@/stores/ui'
import { useUserStore } from '@/stores/user'
const uiStore = useUiStore()
const userStore = useUserStore()
const { showDialog, closeDialog, closeAllDialogs, dialogs } = useDialog()

// ===================================================
// 📦 State
// ===================================================
type LinkItem = {
  to: string
  icon: string
  label: string
}
const links: LinkItem[] = [
  // {
  //   to: '/',
  //   icon: 'home',
  //   label: 'Home',
  // },
  {
    to: '/document',
    icon: 'article',
    label: '문서 분석',
  },
  // {
  //   to: '/stock',
  //   icon: 'bar_chart',
  //   label: '주식 보고서',
  // },
]

// ===================================================
// ⚙️ Methods
// ===================================================
const isActiveLink = (path: string) => {
  if (path === '/') {
    return route.path === '/'
  }

  return route.path === path || route.path.startsWith(`${path}/`)
}

// ===================================================
// 🛠️ Actions
// ===================================================
const handleLogout = async () => {
  try {
    await logout()
  } finally {
    closeDialog('logoutConfirm')
    closeAllDialogs()
    userStore.logout()
    void router.push('/login')
  }
}
</script>
<style lang="scss" scoped>
.q-drawer-container {
  $inner: 12px;
  :deep(.q-drawer) {
    border-width: 2px;
    border-color: var(--ink);
  }
  :deep(.sidebar) {
    display: flex;
    flex-direction: column;
    background: var(--color-surface);
    .sidebar {
      //header
      &__header {
        padding: 16px $inner;
        display: flex;
        align-items: center;
      }
      &__logo {
        background: var(--color-primary);
        font-size: 18px;
        padding: 5px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 8px;
        border-radius: 4px;
      }
      &__title {
        font-weight: 700;
        font-size: mixin.rem(18px);
      }
      // content
      &__content {
        flex-grow: 1;
      }
      &__nav {
        &-list {
          list-style: none;
          margin: 0;
          padding: 0;
        }
        &-item {
        }
        &-link {
          display: flex;
          align-items: center;
          width: 100%;
          text-decoration: none;
          color: var(--color-text-secondary);
          padding: 10px $inner;
          font-weight: 400;
          transition: all 300ms;
          &:hover {
            color: var(--color-text-primary);
            background: rgb(from var(--color-primary) r g b / 10%);
          }
          &.is-active {
            color: var(--ink);
            font-weight: 600;
            background: rgb(from var(--color-primary) r g b / 40%);
          }
        }
        &-icon {
          font-size: 24px;
          margin-right: 8px;
        }
        &-label {
          font-size: mixin.rem(16px);
        }
      }
      // footer
      &__footer {
        margin-top: auto;
        border-top: 1px solid var(--color-border-strong);
        padding: $inner;
      }
      &__user {
        display: flex;
        align-items: center;
        &-info {
          font-size: mixin.rem(16px);
        }
        &-name {
        }
        &-email {
          color: var(--color-text-tertiary);
        }
        &-actions {
          margin-left: 8px;
        }
      }

      &__upgrade {
        margin-top: 8px;
      }
      &__upgrade-btn {
        width: 100%;
      }
    }
  }
}
</style>
