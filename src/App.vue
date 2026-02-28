<script setup>
import { onMounted, ref } from 'vue'

// 💡 响应式变量，记录当前选中的背景颜色
const currentBg = ref('default')

// 💡 切换背景颜色的方法
const setBgColor = (color) => {
  currentBg.value = color
  localStorage.setItem('bgColor', color) // 保存到本地，刷新不丢失

  // 先移除之前可能添加的背景类名
  document.documentElement.classList.remove('bg-pink', 'bg-green')

  // 根据选择添加对应类名
  if (color === 'pink') {
    document.documentElement.classList.add('bg-pink')
  } else if (color === 'green') {
    document.documentElement.classList.add('bg-green')
  }
}

onMounted(() => {
  // 1. 读取夜间模式状态
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'dark') {
    document.documentElement.classList.add('dark-mode')
  }

  // 2. 读取用户之前选择的背景色
  const savedBg = localStorage.getItem('bgColor')
  if (savedBg) {
    setBgColor(savedBg)
  }
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
      <span class="text">分类</span>
    </router-link>
    <router-link to="/favorites" class="nav-item">
      <span class="icon">⭐</span>
      <span class="text">收藏夹</span>
    </router-link>
    <router-link to="/trash" class="nav-item">
      <span class="icon">🗑️</span>
      <span class="text">回收站</span>
    </router-link>
  </nav>
</template>

<style scoped>
/* ==================== 
   🎨 新增：背景色全局样式 
   ==================== */
/* 使用 :global 穿透 scoped，直接作用于全局 body */
:global(body) {
  transition: background-color 0.4s ease; /* 让颜色切换有平滑的过渡动画 */
}

/* 淡粉色 */
:global(.bg-pink body) {
  background-color: #FFE4E1 !important; 
}

/* 绿豆沙色（经典护眼色） */
:global(.bg-green body) {
  background-color: #C7EDCC !important;
}

/* ⚠️ 核心防御：如果开启了夜间模式，强制覆盖自定义背景色，保护视力 */
:global(.dark-mode body) {
  background-color: #121212 !important; 
}


/* ==================== 
   ⚙️ 新增：切换器 UI 
   ==================== */
.bg-switcher {
  position: fixed;
  top: 20px;
  right: 15px; /* 放在右上角，不会挡住主要内容 */
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 10000;
}

.color-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid #ffffff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); /* Q弹动画 */
  padding: 0;
}

.color-btn:hover {
  transform: scale(1.15);
}

/* 被选中时的外圈高亮效果 */
.color-btn.active {
  transform: scale(1.2);
  border-color: #333; 
}

/* 按钮各自的颜色 */
.color-btn.pink { background-color: #FFE4E1; }
.color-btn.green { background-color: #C7EDCC; }
.color-btn.default { background-color: #F5F5F5; }


/* ==================== 
   原有布局样式 (保持不变)
   ==================== */
.main-content {
  padding-bottom: calc(80px + env(safe-area-inset-bottom)); 
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
</style>

<style>
:root {
  --bg-color: #f5f6fa;
  --card-bg: #ffffff;
  --text-main: #333333;      /* 白天的主文字颜色（深灰黑） */
  --nav-bg: #ffffff;
  --border-color: #e4e6eb;
  --text-secondary: #888888; /* 次要文字（灰色） */
}

/* 夜间模式生效时的颜色 */
html.dark-mode {
  --bg-color: #121212;
  --card-bg: #1E1E1E;
  --text-main: #FFFFFF !important;      /* 🌙 晚上的主文字颜色（纯白），加个 !important 强杀 */
  --nav-bg: #1E1E1E;
  --border-color: #2C2C2C;
  --text-secondary: #AAAAAA; /* 晚上的次要文字（浅灰） */
}
</style>