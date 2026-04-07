<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { App } from '@capacitor/app'
import { StatusBar, Style } from '@capacitor/status-bar'
import { Browser } from '@capacitor/browser'

const router = useRouter()
const currentBg = ref('default')

// 🌟 修复：补充缺失的响应式变量声明
const showUpdateModal = ref(false)
const updateInfo = ref({
  version: '',
  message: '',
  url: ''
})

const isNewerVersion = (remote, local) => {
  const v1 = remote.split('.').map(Number)
  const v2 = local.split('.').map(Number)
  for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
    const num1 = v1[i] || 0
    const num2 = v2[i] || 0
    if (num1 > num2) return true
    if (num1 < num2) return false
  }
  return false
}

const checkForUpdate = async () => {
  try {
    const info = await App.getInfo()
    const currentVersion = info.version

    const response = await fetch(
      'https://gist.githubusercontent.com/StephenMa13/85b282b784a0a38333d1a8b36c5ed690/raw/version.json?t=' +
        new Date().getTime()
    )
    const onlineData = await response.json()

    if (isNewerVersion(onlineData.latestVersion, currentVersion)) {
      updateInfo.value = {
        version: onlineData.latestVersion,
        message: onlineData.message,
        url: onlineData.downloadUrl
      }
      showUpdateModal.value = true
    }
  } catch (error) {
    console.log('检查更新失败，可能没联网', error)
  }
}

// 🌟 新增：点击"立即更新"按钮的处理
const goUpdate = async () => {
  if (updateInfo.value.url) {
    try {
      await Browser.open({ url: updateInfo.value.url })
    } catch {
      window.open(updateInfo.value.url, '_blank')
    }
  }
  showUpdateModal.value = false
}

const setBgColor = async (color) => {
  currentBg.value = color
  localStorage.setItem('bgColor', color)

  document.documentElement.classList.remove('bg-pink', 'bg-green')
  if (color === 'pink') document.documentElement.classList.add('bg-pink')
  if (color === 'green') document.documentElement.classList.add('bg-green')

  try {
    if (document.documentElement.classList.contains('dark-mode')) {
      await StatusBar.setBackgroundColor({ color: '#121212' })
      await StatusBar.setStyle({ style: Style.Dark })
      await StatusBar.overlaysWebView({ overlay: true })
    } else if (color === 'pink') {
      await StatusBar.setBackgroundColor({ color: '#FFE4E1' })
      await StatusBar.setStyle({ style: Style.Light })
      await StatusBar.overlaysWebView({ overlay: true })
    } else if (color === 'green') {
      await StatusBar.setBackgroundColor({ color: '#C7EDCC' })
      await StatusBar.setStyle({ style: Style.Light })
      await StatusBar.overlaysWebView({ overlay: true })
    } else {
      await StatusBar.setBackgroundColor({ color: '#F5F5F5' })
      await StatusBar.setStyle({ style: Style.Light })
      await StatusBar.overlaysWebView({ overlay: true })
    }
  } catch (error) {
    console.warn('StatusBar 插件在当前环境下不可用')
  }
}

// 🌟 新增：适配系统顶栏和底栏
const handleSafeArea = async () => {
  try {
    // 让应用扩展到屏幕全边界
    await StatusBar.overlaysWebView({ overlay: true })
    // 也可以配置安全区域行为（如果 Capacitor 版本支持）
  } catch (error) {
    console.warn('Safe area 适配失败', error)
  }
}

onMounted(async () => {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'dark') {
    document.documentElement.classList.add('dark-mode')
  }

  const savedBg = localStorage.getItem('bgColor')
  if (savedBg) {
    setBgColor(savedBg)
  }else {
    setBgColor('default')
  }

  await handleSafeArea()

  App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) {
      router.back()
    } else {
      App.exitApp()
    }
  })

  checkForUpdate()
})
</script>

<template>
  <div class="main-content">
    <router-view />
  </div>

  <nav class="bottom-nav">
    <router-link to="/" class="nav-item">
      <span class="icon">🏠</span>
      <span class="text">首页</span>
    </router-link>
    <router-link to="/categories" class="nav-item">
      <span class="icon">🫧</span>
      <span class="text">梗星系</span>
    </router-link>
    <router-link to="/favorites" class="nav-item">
      <span class="icon">⭐</span>
      <span class="text">收藏夹</span>
    </router-link>
  </nav>

  <!-- 🌟 修复：更新弹窗 UI（之前缺失） -->
  <Teleport to="body">
    <div v-if="showUpdateModal" class="update-overlay" @click.self="showUpdateModal = false">
      <div class="update-modal">
        <h3>🎉 发现新版本 v{{ updateInfo.version }}</h3>
        <p>{{ updateInfo.message || '修复了一些问题，提升了体验~' }}</p>
        <div class="update-actions">
          <button class="btn-skip" @click="showUpdateModal = false">下次再说</button>
          <button class="btn-update" @click="goUpdate">立即更新</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
:global(body) {
  transition: background-color 0.4s ease;
  margin: 0;
  padding: 0;
}
/* ==================== 
   主体布局
   ==================== */
.main-content {
  padding-top: env(safe-area-inset-top);
  padding-bottom: calc(60px + env(safe-area-inset-bottom));
  min-height: 100vh;
  box-sizing: border-box;
}

.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  margin: 0 auto;
  width: 100%;
  max-width: 600px;
  box-sizing: border-box;
  background-color: #ffffff;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: space-around;
  align-items: center;
  z-index: 9999;
  border-top: 1px solid var(--border-color, #eee);
  padding: 10px 0 calc(10px + env(safe-area-inset-bottom)) 0;
  transition: background-color 0.3s ease;
}

:global(.dark-mode) .bottom-nav {
  background-color: #1E1E1E;
  border-top-color: #333;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  color: #888;
  font-size: 12px;
  transition: all 0.3s ease;
  flex: 1;
  -webkit-tap-highlight-color: transparent;
}

.nav-item .icon {
  font-size: 24px;
  margin-bottom: 4px;
}

.router-link-active {
  color: #ff4757;
  transform: scale(1.15);
}

/* ==================== 
   🌟 更新弹窗样式
   ==================== */
.update-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
}

.update-modal {
  background: #fff;
  border-radius: 16px;
  padding: 28px 24px;
  width: 85%;
  max-width: 340px;
  text-align: center;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.update-modal h3 {
  margin: 0 0 12px;
  font-size: 18px;
  color: #333;
}

.update-modal p {
  margin: 0 0 24px;
  font-size: 14px;
  color: #666;
  line-height: 1.6;
}

.update-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn-skip {
  flex: 1;
  padding: 10px 0;
  border: 1px solid #ddd;
  border-radius: 10px;
  background: #fff;
  color: #888;
  font-size: 14px;
  cursor: pointer;
}

.btn-update {
  flex: 1;
  padding: 10px 0;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #ff4757, #ff6b81);
  color: #fff;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
}

:global(.dark-mode) .update-modal {
  background: #2a2a2a;
}
:global(.dark-mode) .update-modal h3 {
  color: #fff;
}
:global(.dark-mode) .update-modal p {
  color: #aaa;
}
</style>