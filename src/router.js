import { createRouter, createWebHistory } from 'vue-router'
import Home from './pages/Home.vue'
import Detail from './pages/Detail.vue'
import Favorites from './pages/Favorites.vue'
import Trash from './pages/Trash.vue'
import Categories from './pages/Categories.vue'
import CategoryDetail from './pages/CategoryDetail.vue' 
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Home }, 
    { path: '/meme/:id', component: Detail }, 
    
    { path: '/trash', component: Trash },
    { path: '/favorites', component: Favorites }, 
    { path: '/categories', component: Categories},
    { path: '/category/:name', component: CategoryDetail }
  
  ]
})

export default router