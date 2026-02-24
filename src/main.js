import { createApp } from 'vue'
import App from './App.vue'
import router from './router' // ⭐️ 引入我们刚写的路由

// ⭐️ 1. 引入 PWA 注册函数
import { registerSW } from 'virtual:pwa-register'

// ⭐️ 2. 立即注册 Service Worker
registerSW({ immediate: true })

const app = createApp(App)
app.use(router) // ⭐️ 让整个 Vue 应用使用这个路由
app.mount('#app')