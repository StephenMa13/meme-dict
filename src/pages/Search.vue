<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getMemes } from '../db.js'
import { favoriteIds, toggleFavorite, blacklistIds, likedIds, toggleLike } from '../store.js'

const route = useRoute()
const router = useRouter()

// 数据状态
const allMemes = ref([])
const inputText = ref('') // 绑定搜索框输入
const searchHistory = ref(JSON.parse(localStorage.getItem('searchHistory') || '[]'))
const showHistory = ref(false)

// 1. 初始化：从 URL 获取关键词并加载数据
const initSearch = () => {
  allMemes.value = getMemes()
  const query = route.query.q || ''
  inputText.value = query // 让搜索框显示当前的词
}

// 2. 监听路由变化：当用户在搜索页再次点击搜索，URL 变化时触发
watch(() => route.query.q, (newQ) => {
  inputText.value = newQ || ''
})

// 3. 执行搜索：更新 URL（这会触发 watch 重新渲染结果）
const executeSearch = () => {
  const term = inputText.value.trim()
  if (term) {
    // 保存历史记录
    searchHistory.value = searchHistory.value.filter(item => item !== term)
    searchHistory.value.unshift(term)
    if (searchHistory.value.length > 10) searchHistory.value.pop()
    localStorage.setItem('searchHistory', JSON.stringify(searchHistory.value))
    
    // 跳转/更新 URL
    router.push({ path: '/search', query: { q: term } })
  }
  showHistory.value = false
}

// 4. 计算过滤结果：核心逻辑
const filteredResults = computed(() => {
  const q = route.query.q || ''
  if (!q) return []
  return allMemes.value.filter(item => 
    item.term.toLowerCase().includes(q.toLowerCase()) && 
    !blacklistIds.value.includes(item.id)
  )
})

// 交互功能
const selectHistory = (term) => {
  inputText.value = term
  executeSearch()
}

const clearHistory = () => {
  searchHistory.value = []
  localStorage.removeItem('searchHistory')
}

const goToDetail = (id) => router.push(`/meme/${id}`)

const truncate = (text) => {
  if (!text) return ''
  return text.length > 10 ? text.slice(0, 10) + '…' : text
}

onMounted(() => initSearch())
</script>

<template>
  <div class="app-container">
    <nav class="navbar">
      <div class="navbar-left" @click="router.push('/')" style="cursor:pointer">
        <div class="logo">🔥 梗查查</div>
      </div>
      <div class="nav-actions">
        <button class="back-home-btn" @click="router.push('/')">
            <span class="icon">🏠</span> 
            <span class="text">返回首页</span>
        </button>
      </div>
    </nav>

    <header class="hero" style="padding-bottom: 0;">
      <div class="search-wrapper">
        <div class="search-box">
          <input 
            v-model="inputText" 
            type="text" 
            placeholder="再次搜索内容..." 
            class="search-input"
            @focus="showHistory = true" 
            @blur="showHistory = false" 
            @click="showHistory = true"
            @keydown.enter="executeSearch"
          />
        </div>

        <div class="history-dropdown" v-if="showHistory && searchHistory.length > 0">
          <div class="history-header">
            <span class="history-title">最近搜索</span>
            <span class="clear-btn" @mousedown.prevent="clearHistory">🗑️ 清空</span>
          </div>
          <ul class="history-list">
            <li v-for="item in searchHistory" :key="item" @mousedown.prevent="selectHistory(item)">
              🕒 {{ item }}
            </li>
          </ul>
        </div>
      </div>
    </header>

    <main class="hot-list">
      <div class="section-header">
        <h2 class="section-title">🔍 “{{ route.query.q }}” 的结果 ({{ filteredResults.length }})</h2>
      </div>
      
      <div v-if="filteredResults.length === 0" class="empty-state">
        没有找到这个梗，换个词试试？或者去首页贡献一个！😊
      </div>

      <div v-else class="card-grid">
        <div class="card" v-for="meme in filteredResults" :key="meme.id" @click="goToDetail(meme.id)">
          <div class="card-top">
            <div class="meme-info">
              <h3 class="meme-term">{{ truncate(meme.term) }}</h3>
            </div>
            <div class="card-actions">
              <button class="action-btn fav-btn small-btn" :class="{ 'active': favoriteIds.includes(meme.id) }" @click.stop="toggleFavorite(meme.id)">
                {{ favoriteIds.includes(meme.id) ? '⭐' : '☆' }}
              </button>
              <button class="action-btn like-btn small-btn" @click.stop="toggleLike(meme.id)">
                {{ likedIds.includes(meme.id) ? '❤️' : '🤍' }}
              </button>            
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* 引用之前写好的全局变量和样式 */
@import '../style.css'; /* 确保引入了全局变量 */

.app-container { min-height: 100vh; background: transparent; }
.navbar { max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; padding: 12px 20px; }
.logo { font-size: 20px; font-weight: bold; color: var(--text-main); }
.hero { padding: 20px; text-align: center; }
.search-wrapper { position: relative; max-width: 600px; margin: 0 auto; z-index:1001;}
.search-box { display: flex; background: var(--card-bg); border-radius: 30px; padding: 4px; border: 1px solid var(--border-color); }
.search-input { flex: 1; border: none; padding: 10px 20px; outline: none; background: transparent; color: var(--text-main); }

.hot-list { max-width: 1200px; margin: 0 auto; padding: 20px; }
.empty-state { text-align: center; padding: 60px 20px; color: var(--text-secondary,#888); background-color: var(--card-bg) !important;border: 1px solid var(--border-color); border-radius: 16px; margin-top: 20px;box-shadow: 0 4px 12px rgba(0,0,0,0.05); }

/* 搜索结果卡片样式 */
.card-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
.card { background: var(--card-bg) !important; border: 1px solid var(--border-color); border-radius: 12px; padding: 12px 16px; transition: transform 0.2s; cursor: pointer; }
.card:hover { transform: translateY(-2px); }
/* 找到 .meme-info，添加 flex: 1 */
.meme-info {
  flex: 1;              /* 🌟 核心：强制让文字区域占据左侧所有剩余空间 */
  display: flex;
  align-items: center;
  min-width: 0;         /* 防止文字过长撑破布局 */
}

/* 确保父容器是通栏的 */
.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;          /* 确保宽度百分之百 */
  gap: 12px;
}
.meme-term { margin: 0; color: var(--text-main); font-size: 16px; }
.card-actions { display: flex; gap: 8px; }
.action-btn { border: none; padding: 6px 10px; border-radius: 10px; cursor: pointer; font-size: 12px; font-weight: bold; transition: 0.2s; }
.fav-btn { background: rgba(74, 144, 226, 0.1); color: #4a90e2; }
.like-btn { background: rgba(255, 143, 0, 0.1); color: #ff8f00; }

/* 历史记录下拉框 */
.history-dropdown { position: absolute; top: 55px; left: 0; width: 100%; background: var(--card-bg); border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); z-index: 100; border: 1px solid var(--border-color); }
.history-header { display: flex; justify-content: space-between; padding: 10px 20px; font-size: 12px; color: #888; border-bottom: 1px solid var(--border-color); }
.history-list { list-style: none; margin: 0; padding: 0; text-align: left; }
.history-list li { padding: 12px 20px; color: var(--text-main); cursor: pointer; }
.history-list li:hover { background: var(--bg-color); }

.back-home-btn {
  /* 基础布局：使用 Flex 居中对齐图标和文字 */
  display: flex;
  align-items: center;
  gap: 6px;
  
  /* 形状与边距：25px 以上的圆角能形成完美的胶囊状 */
  padding: 8px 18px;
  border-radius: 25px;
  
  /* 颜色设置：使用你定义的变量，确保适配白天/夜间模式 */
  background-color: var(--card-bg);
  color: var(--text-main);
  border: 1px solid var(--border-color);
  
  /* 字体细节 */
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  
  /* 动画过渡：让缩放和阴影变化更自然 */
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

/* 悬浮态：轻微上浮并加深阴影 */
.back-home-btn:hover {
  transform: translateY(-1px);
  background-color: var(--bg-color);
  border-color: #FFD700; /* 悬浮时透出一点你 logo 的标志金黄色 */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 点击态：模拟按下效果 */
.back-home-btn:active {
  transform: translateY(1px) scale(0.96);
}

/* 针对小屏幕，可以只显示图标，让导航栏不拥挤 */
@media (max-width: 480px) {
  .back-home-btn .text {
    display: none;
  }
  .back-home-btn {
    padding: 8px 12px;
  }
}
@media (min-width: 768px) { .card-grid { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 1024px) { .card-grid { grid-template-columns: repeat(3, 1fr); } }
</style>