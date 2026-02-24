import { createRouter, createWebHistory } from 'vue-router'
import Home from './pages/Home.vue'
import Detail from './pages/Detail.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Home }, // 访问根目录时，播放 Home 频道
    { path: '/meme/:id', component: Detail } // 访问 /meme/数字 时，播放 Detail 频道
  ]
})

export default router