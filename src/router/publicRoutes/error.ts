import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/403',
    name: 'Forbidden',
    component: () => import('@/pages/error/ErrorForbidden.vue'),
    meta: {
      public: true,
    },
  },
  {
    path: '/:catchAll(.*)*',
    name: 'NotFound',
    component: () => import('@/pages/error/ErrorNotFound.vue'),
    meta: {
      public: true,
    },
  },
]

export default routes
