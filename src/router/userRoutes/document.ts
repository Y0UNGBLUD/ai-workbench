import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: 'document',
    name: 'Doc',
    component: () => import('@/pages/document/Index.vue'),
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: 'document/:id',
    name: 'Doc Detail',
    component: () => import('@/pages/document/Detail.vue'),
    meta: {
      requiresAuth: true,
    },
  },
]

export default routes
