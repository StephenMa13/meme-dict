<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getMemes } from '../db.js'
import { favoriteIds, toggleFavorite, blacklistIds, likedIds, toggleLike } from '../store.js'

const route = useRoute()
const router = useRouter()

// 数据状态
const allMemes = ref([])
const inputText = ref('') 
const searchHistory = ref(JSON.parse(localStorage.getItem('searchHistory') || '[]'))
const showHistory = ref(false)

// 1. 初始化
const initSearch = () => {
  allMemes.value = getMemes()
  const query = route.query.q || ''
  inputText.value = query 
}

// 2. 监听路由
watch(() => route.query.q, (newQ) => {
  inputText.value = newQ || ''
})

// 3. 执行搜索
const executeSearch = () => {
  const term = inputText.value.trim()
  if (term) {
    searchHistory.value = searchHistory.value.filter(item => item !== term)
    searchHistory.value.unshift(term)
    if (searchHistory.value.length > 10) searchHistory.value.pop()
    localStorage.setItem('searchHistory', JSON.stringify(searchHistory.value))
    
    router.push({ path: '/search', query: { q: term } })
  }
  showHistory.value = false
}

// 4. 计算过滤结果：允许搜到黑名单，但将其排在最后
const filteredResults = computed(() => {
  const q = route.query.q || ''
  if (!q) return []
  
  return allMemes.value
    .filter(item => item.term.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => {
      const aIsBlack = blacklistIds.value.includes(a.id)
      const bIsBlack = blacklistIds.value.includes(b.id)
      
      // 排序逻辑：非黑名单在前 (返回 -1)，黑名单在后 (返回 1)
      if (aIsBlack && !bIsBlack) return 1
      if (!aIsBlack && bIsBlack) return -1
      return 0
    })
})

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
        <div class="logo">
          <img src="/Home-logo.png" alt="Logo" class="spark-logo" />  
          梗查查
        </div>
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
            @click.stop="showHistory = true"
            @keydown.enter="executeSearch"
          />
          <!-- 🌟 新增：搜索图标按钮 -->
          <button class="search-icon-btn" @click="executeSearch">
            🔍
          </button>
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
        没有找到这个梗，换个词试试？😊
      </div>

      <div v-else class="card-grid">
        <!-- 🌟 动态样式：如果是黑名单词条，降低透明度 -->
        <div 
          class="card" 
          v-for="meme in filteredResults" 
          :key="meme.id" 
          @click="goToDetail(meme.id)"
          :class="{ 'is-blacklist': blacklistIds.includes(meme.id) }"
        >
          <div class="card-top">
            <div class="meme-info">
              <h3 class="meme-term">
                {{ truncate(meme.term) }}
              </h3>
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
@import '../style.css';

.app-container { min-height: 100vh; background: transparent; }
.navbar { max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; padding: 12px 20px; }
.logo { font-size: 18px; font-weight: bold; color: var(--text-main); display: flex;align-items: center;gap: 8px;}
.spark-logo { width: 1.5em;  height: 1.5em;  object-fit: contain; position: relative;top: 1px;}

.hero { padding: 20px; text-align: center; }
.search-wrapper { position: relative; max-width: 600px; margin: 0 auto; z-index:1001;}

/* 搜索框容器调整 */
.search-box { 
  display: flex; 
  align-items: center;
  background: var(--card-bg); 
  border-radius: 30px; 
  padding: 4px 8px; 
  border: 1px solid var(--border-color); 
}

.search-input { 
  flex: 1; 
  border: none; 
  padding: 10px 15px; 
  outline: none; 
  background: transparent; 
  color: var(--text-main); 
  font-size: 16px;
}

/* 🌟 搜索图标按钮样式 */
.search-icon-btn {
  background: none;
  border: none;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 18px;
  transition: transform 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.search-icon-btn:hover {
  transform: scale(1.2);
}

.hot-list { max-width: 1200px; margin: 0 auto; padding: 20px; }
.empty-state { text-align: center; padding: 60px 20px; color: var(--text-secondary,#888); background-color: var(--card-bg) !important;border: 1px solid var(--border-color); border-radius: 16px; margin-top: 20px;box-shadow: 0 4px 12px rgba(0,0,0,0.05); }

/* 卡片布局 */
.card-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
.card { background: var(--card-bg) !important; border: 1px solid var(--border-color); border-radius: 12px; padding: 12px 16px; transition: transform 0.2s; cursor: pointer; }
.card:hover { transform: translateY(-2px); }

/* 🌟 黑名单状态样式 */
.card.is-blacklist {
  opacity: 0.5;
  filter: grayscale(0.8);
}
.blacklist-tag {
  font-size: 10px;
  color: #999;
  font-weight: normal;
  margin-left: 5px;
}

.meme-info { flex: 1; display: flex; align-items: center; min-width: 0; }
.card-top { display: flex; justify-content: space-between; align-items: center; width: 100%; gap: 12px; }
.meme-term { margin: 0; color: var(--text-main); font-size: 16px; font-weight: bold; }
.card-actions { display: flex; gap: 8px; }

/* 按钮样式保持一致 */
.small-btn { width: 44px; padding: 6px 0; }
.action-btn { border: none; border-radius: 10px; cursor: pointer; font-size: 14px; transition: 0.2s; display: flex; align-items: center; justify-content: center;}
.fav-btn { background: rgba(74, 144, 226, 0.1); color: #4a90e2; }
.like-btn { background: rgba(255, 143, 0, 0.1); color: #ff8f00; }
.fav-btn.active { background: #4a90e2; color: white; }

/* 历史记录 */
.history-dropdown { position: absolute; top: 55px; left: 0; width: 100%; background: var(--card-bg); border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); z-index: 100; border: 1px solid var(--border-color); }
.history-header { display: flex; justify-content: space-between; padding: 10px 20px; font-size: 12px; color: #888; border-bottom: 1px solid var(--border-color); }
.clear-btn { cursor: pointer; }
.history-list { list-style: none; margin: 0; padding: 0; text-align: left; }
.history-list li { padding: 12px 20px; color: var(--text-main); cursor: pointer; }
.history-list li:hover { background: var(--bg-color); }

@media (min-width: 768px) { .card-grid { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 1024px) { .card-grid { grid-template-columns: repeat(3, 1fr); } }
</style>
