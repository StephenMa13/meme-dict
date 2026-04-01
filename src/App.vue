<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router' // 1. 引入路由
import { App } from '@capacitor/app'   // 2. 引入 Capacitor App 插件
import { StatusBar, Style } from '@capacitor/status-bar';
import { Browser } from '@capacitor/browser';

// 💡 响应式变量，记录当前选中的背景颜色
const router = useRouter()
const currentBg = ref('default')

// 🌟 新增：智能版本号对比函数 (如果 remote > local 返回 true)
const isNewerVersion = (remote, local) => {
  const v1 = remote.split('.').map(Number); // 把 "1.0.2" 变成 [1, 0, 2]
  const v2 = local.split('.').map(Number);
  
  for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
    const num1 = v1[i] || 0;
    const num2 = v2[i] || 0;
    if (num1 > num2) return true;  // 网上版本更大，需要更新
    if (num1 < num2) return false; // 本地版本更大（比如你在测试新版），不需要更新
  }
  return false; // 一模一样，不需要更新
}

// 🌟 新增：检查更新的函数
const checkForUpdate = async () => {
  try {
    // 1. 获取当前 App 的版本信息 (比如 1.0.0)
    const info = await App.getInfo();
    const currentVersion = info.version; 
    
    // 2. 去网上抓取最新的版本信息 (替换为你自己的真实 JSON 链接)
    const response = await fetch('https://gist.githubusercontent.com/StephenMa13/85b282b784a0a38333d1a8b36c5ed690/raw/version.json?t=' + new Date().getTime()); // 加时间戳防止缓存
    const onlineData = await response.json();
    
    // 3. 比较版本号 (最简单的字符串比较，如果是 1.0.1 > 1.0.0 就会触发)
    if (isNewerVersion(onlineData.latestVersion, currentVersion)) {
      updateInfo.value = {
        version: onlineData.latestVersion,
        message: onlineData.message,
        url: onlineData.downloadUrl
      }
      showUpdateModal.value = true
    }
  } catch (error) {
    console.log('检查更新失败，可能没联网', error);
  }
}

// 💡 切换背景颜色的z方法
const setBgColor = async (color) => {
  currentBg.value = color
  localStorage.setItem('bgColor', color)

  // 处理网页内部的背景类名
  document.documentElement.classList.remove('bg-pink', 'bg-green')
  if (color === 'pink') document.documentElement.classList.add('bg-pink')
  if (color === 'green') document.documentElement.classList.add('bg-green')

  // --- 🌟 核心：同步修改手机状态栏 ---
  // 使用 try-catch 防止在浏览器预览时报错导致后续代码不执行
  try {
    // 逻辑 A：如果当前是夜间模式，状态栏永远是黑色
    if (document.documentElement.classList.contains('dark-mode')) {
      await StatusBar.setBackgroundColor({ color: '#121212' });
      await StatusBar.setStyle({ style: Style.Dark }); // 状态栏文字为白色
    } 
    // 逻辑 B：如果不是夜间模式，根据颜色调整
    else if (color === 'pink') {
      await StatusBar.setBackgroundColor({ color: '#FFE4E1' });
      await StatusBar.setStyle({ style: Style.Light }); // 状态栏文字为黑色
    } 
    else if (color === 'green') {
      await StatusBar.setBackgroundColor({ color: '#C7EDCC' });
      await StatusBar.setStyle({ style: Style.Light });
    } 
    // 逻辑 C：默认背景（白色或浅灰色）
    else {
      await StatusBar.setBackgroundColor({ color: '#F5F5F5' }); // 你的默认背景色
      await StatusBar.setStyle({ style: Style.Light });
    }
  } catch (error) {
    console.warn('StatusBar 插件在当前环境下不可用 (可能是浏览器环境)');
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

  App.addListener('backButton', ({ canGoBack }) => {
    // 逻辑：如果浏览器历史记录可以后退，就后退；否则退出应用
    if (canGoBack) {
      window.history.back() 
    } else {
      // 如果已经在首页（或者没有历史记录了），直接关闭应用
      App.exitApp()
    }
  })
  checkForUpdate(); // 应用启动时检查更新
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
  --bg-color: #FFE4E1 !important; 
}

/* 绿豆沙色（经典护眼色） */
:global(.bg-green body) {
  --bg-color: #C7EDCC !important;
}

/* ⚠️ 核心防御：如果开启了夜间模式，强制覆盖自定义背景色，保护视力 */
:global(.dark-mode body) {
  --bg-color: #121212 !important; 
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
  padding-top: env(safe-area-inset-top);
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
/* 📱 新增：专门针对手机屏幕（宽度小于 768px）的样式调整 */
@media (max-width: 768px) {
  .main-content {
    /* 在安全距离的基础上，额外往下移动 40px，你可以根据实际视觉效果修改这个数字 */
    padding-top: calc(40px + env(safe-area-inset-top)); 
  }
}
</style>