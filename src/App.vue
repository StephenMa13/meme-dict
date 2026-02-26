<script setup>
import { onMounted } from 'vue'

// 💡 只保留这个：页面一加载，就去读取之前保存的主题，保证刷新不断联
onMounted(() => {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'dark') {
    document.documentElement.classList.add('dark-mode')
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
.main-content {
  /* 💡 给主内容区域留出足够的空间，同样加上安全距离，防止最后一张卡片被挡住 */
  padding-bottom: calc(80px + env(safe-area-inset-bottom)); 
}

.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0; /* 配合 margin 居中 */
  margin: 0 auto; /* 在平板/PC上居中显示，不会拉伸到变形 */
  width: 100%;
  max-width: 600px; /* 💡 限制最大宽度，在 iPad 上看着也像一个精致的 App */
  box-sizing: border-box; /* 保证 padding 不会把宽度撑爆 */
  
  /* ❌ 删掉了写死的 height: 65px，让内容和 padding 自动撑开高度 */
  
  background-color: var(--card-bg);
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: space-around;
  align-items: center;
  z-index: 999;
  border-top: 1px solid var(--border-color);
  
  /* 💡 核心魔法：上 10px，左右 0，下 10px+安全距离 */
  padding: 10px 0 calc(10px + env(safe-area-inset-bottom)) 0;
  transition: background-color 0.3s ease;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  color: var(--text-main, #888); /* 建议也用变量，防止夜间模式看不清 */
  font-size: 12px;
  transition: all 0.3s ease;
  flex: 1; /* 让每个按钮均匀分配点击区域，不会误触 */
  -webkit-tap-highlight-color: transparent; /* 去除安卓点击时难看的灰色闪烁方块 */
}

.nav-item .icon {
  font-size: 24px;
  margin-bottom: 4px;
}

.router-link-active {
  color: #ff4757;
  transform: scale(1.15); /* 稍微放大一点点，动效更Q弹 */
}
</style>