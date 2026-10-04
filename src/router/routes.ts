import type { RouteRecordRaw } from 'vue-router'
import errorRoute from './publicRoutes/error'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'AuthLayout',
    component: () => import('@/layouts/AuthLayout.vue'),
    meta: {
      requiresAuth: false,
    },
    children: [
      {
        path: '',
        name: 'Login',
        component: () => import('@/pages/auth/LoginPage.vue'),
      },
    ],
  },

  {
    path: '/',
    name: 'MainLayout',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: {
      requiresAuth: true,
    },
    children: [],
  },
  // error
  ...errorRoute,
]

export default routes
