import { createRouter, createWebHistory } from 'vue-router'
import Home from './pages/Home.vue'
import Detail from './pages/Detail.vue'
import Favorites from './pages/Favorites.vue'
import Categories from './pages/Categories.vue'
import CategoryDetail from './pages/CategoryDetail.vue' 
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Home }, 
    { path: '/meme/:id', component: Detail }, 
    { path: '/favorites', component: Favorites }, 
    { path: '/categories', component: Categories},
    { path: '/category/:name', component: CategoryDetail }
  
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      // 如果用户点浏览器的“后退”或你的 ⬅️ 返回按钮，回到他离开前的位置
      return savedPosition
    } else {
      // 如果是进入新页面，直接回到顶部
      return { top: 0 }
    }
  }
})

export default router