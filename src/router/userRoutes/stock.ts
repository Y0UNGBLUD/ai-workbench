import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: 'stock',
    name: 'Stock',
    component: () => import('@/pages/stock/Index.vue'),
    meta: {
      requiresAuth: true,
    },
  },
]

export default routes
