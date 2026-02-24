import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate', // 有新版本时自动更新
      devOptions: {
        enabled: true // ⭐️ 允许我们在本地开发环境(npm run dev)下直接测试 PWA
      },
      manifest: {
        name: '本地梗词典', // App 的全称
        short_name: '梗词典', // 手机桌面上显示的名字（字数要少）
        description: '我的私人离线梗百科全书',
        theme_color: '#FFD700', // 手机顶部状态栏的颜色（匹配我们主题的金黄色）
        background_color: '#F7F8FA', // 启动界面的背景色
        display: 'standalone', // ⭐️ 重点：这会让 App 隐藏浏览器的地址栏，看起来和原生 App 一模一样！
        icons: [
          {
            src: 'https://dummyimage.com/192x192/FFD700/000000.png&text=Meme',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'https://dummyimage.com/512x512/FFD700/000000.png&text=Meme',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})