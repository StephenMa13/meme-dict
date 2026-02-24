<template>
  <div class="main-content">
    <router-view />
  </div>

  <nav class="bottom-nav">
    <router-link to="/" class="nav-item">
      <span class="icon">🏠</span>
      <span class="text">首页</span>
    </router-link>
    <router-link to="/favorites" class="nav-item">
      <span class="icon">⭐</span>
      <span class="text">收藏夹</span>
    </router-link>
  </nav>
</template>

<style scoped>
/* 给主要内容区域底部留出空间，防止被导航栏挡住 */
.main-content {
  padding-bottom: 70px; 
}

/* 底部导航栏的酷炫样式 */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 65px;
  background-color: #ffffff;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: space-around;
  align-items: center;
  z-index: 1000;
  /* 适配苹果手机底部的“黑条”安全区 */
  padding-bottom: env(safe-area-inset-bottom);
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

/* 当点击处于当前页面时，图标高亮变色 */
.router-link-active {
  color: #ff4757;
  transform: scale(1.1);
}
</style>