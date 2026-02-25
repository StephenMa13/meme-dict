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
  padding-bottom: 70px; 
}

.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 65px;
  background-color: var(--nav-bg); /* 已适配夜间模式变量 */
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: space-around;
  align-items: center;
  z-index: 1000;
  padding-bottom: env(safe-area-inset-bottom);
  transition: background-color 0.3s ease;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  color: #888;
  font-size: 12px;
  transition: all 0.3s ease;
}

.nav-item .icon {
  font-size: 24px;
  margin-bottom: 2px;
}

.router-link-active {
  color: #ff4757;
  transform: scale(1.1);
}
</style>