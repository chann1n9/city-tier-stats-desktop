import { createRouter, createWebHashHistory } from 'vue-router'

import HomePage from '../pages/HomePage.vue'
import SearchPage from '../pages/SearchPage.vue'
import InboxPage from '../pages/InboxPage.vue'
import DetailPage from '../pages/DetailPage.vue'
import SettingsPage from '../pages/SettingsPage.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      redirect: '/home',
    },
    {
      path: '/home',
      name: 'home',
      component: HomePage,
    },
    {
      path: '/search',
      name: 'search',
      component: SearchPage,
    },
    {
      path: '/inbox',
      name: 'inbox',
      component: InboxPage,
    },
    {
      path: '/detail/:fileId',
      name: 'detail',
      component: DetailPage,
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsPage,
    },
  ],
})

export default router
