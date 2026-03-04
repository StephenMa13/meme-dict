<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getMemes, addMeme as localAdd} from '../db.js'
import { favoriteIds, toggleFavorite, blacklistIds, randomMemes, likedIds, toggleLike } from '../store.js'
import { categoryConfig } from '../categories' 
const router = useRouter()
const hotMemes = ref([]) // 真正的所有梗的数据源

// 🌟 搜索相关状态
const inputText = ref('')     
const activeSearch = ref('')  
const searchHistory = ref(JSON.parse(localStorage.getItem('searchHistory') || '[]'))
const showHistory = ref(false)

// 🌟 弹窗与表单状态
const showModal = ref(false)
const newForm = ref({ term: '', summary: '', category: '默认' })

// 🌟 主题相关状态
const currentBg = ref('default')
const isDark = ref(false)

// ==========================================
// 核心逻辑函数
// ==========================================

// 1. 执行搜索并保存历史
const executeSearch = () => {
  const term = inputText.value.trim()
  /*activeSearch.value = term */

  if (term) {
    searchHistory.value = searchHistory.value.filter(item => item !== term)
    searchHistory.value.unshift(term)
    if (searchHistory.value.length > 10) searchHistory.value.pop()
    localStorage.setItem('searchHistory', JSON.stringify(searchHistory.value))
    router.push({ path: '/search', query: { q: term } })
  }
  showHistory.value = false 
}

// 2. 搜索框防空处理
const handleInput = () => {
  if (inputText.value.trim() === '') {
    activeSearch.value = ''
  }
}

const selectHistory = (term) => {
  inputText.value = term
  executeSearch()
}

const clearHistory = () => {
  searchHistory.value = []
  localStorage.removeItem('searchHistory')
}

// 在 script setup 顶部定义已阅池（或者从 localStorage 读取实现持久化）
const viewedIds = ref(JSON.parse(localStorage.getItem('viewedIds') || '[]'))

// 3. 🎲 刷新猜你想看列表
const refreshRandomMemes = () => {
  const availableMemes = hotMemes.value.filter(meme => !blacklistIds.value.includes(meme.id))
  let unviewed = availableMemes.filter(meme => !viewedIds.value.includes(meme.id))
  if (unviewed.length <5) {
    viewedIds.value = []
    unviewed = availableMemes
  }
  const shuffled = [...unviewed].sort(() => 0.5 - Math.random())
  let picked = shuffled.slice(0, 5)
  picked.sort((a,b) => a.term.length - b.term.length)
  randomMemes.value = picked
  const ids = picked.map(m => m.id)
  // 只有在重置后，或者正常追加时，确保 viewedIds 能够准确追踪
  // 如果刚才重置了，viewedIds 就是 newIds；如果没有重置，就是累加
  // 简便写法：
  const currentTotalViewed = JSON.parse(localStorage.getItem('viewedIds') || '[]')
  // 如果上面重置了，这里就只存新的，否则合并
  const updatedViewed = unviewed.length === availableMemes.length ? ids : [...currentTotalViewed, ...ids]
  
  viewedIds.value = updatedViewed
  localStorage.setItem('viewedIds', JSON.stringify(updatedViewed))
  sessionStorage.setItem('cachedRandomIds', JSON.stringify(ids))
}

// 4. 完美的过滤计算属性
const filteredMemes = computed(() => {
  // 对当前随机到的梗进行排序
  return [...randomMemes.value].sort((a, b) => {
    const aIsBlack = blacklistIds.value.includes(a.id) ? 1 : 0
    const bIsBlack = blacklistIds.value.includes(b.id) ? 1 : 0
    return aIsBlack - bIsBlack // 黑名单(1) 会排在 非黑名单(0) 后面
  })
})

// 5. 主题与背景切换
const setBgColor = (color) => {
  currentBg.value = color
  localStorage.setItem('bgColor', color)

  document.documentElement.classList.remove('bg-pink', 'bg-green')
  
  if (color === 'pink') {
    document.documentElement.classList.add('bg-pink')
  } else if (color === 'green') {
    document.documentElement.classList.add('bg-green')
  }
}

const toggleTheme = () => {
  isDark.value = !isDark.value
  if (isDark.value) {
    document.documentElement.classList.add('dark-mode')
    localStorage.setItem('theme', 'dark')
  } else {
    document.documentElement.classList.remove('dark-mode')
    localStorage.setItem('theme', 'light')
  }
}

// 6. 初始化加载
const loadThemeAndData = () => {
  isDark.value = localStorage.getItem('theme') === 'dark'
  if (isDark.value) document.documentElement.classList.add('dark-mode')

  const savedBg = localStorage.getItem('bgColor')
  if (savedBg) setBgColor(savedBg)

  hotMemes.value = getMemes()
  const cachedIds = JSON.parse(sessionStorage.getItem('cachedRandomIds') || 'null')
  
  if (cachedIds && cachedIds.length > 0) {
    const cachedMemes = hotMemes.value.filter(m => cachedIds.includes(m.id))
    cachedMemes.sort((a,b) => a.term.length - b.term.length)
    randomMemes.value = cachedMemes
  } else if (randomMemes.value.length === 0) {
    refreshRandomMemes()
  }
}

onMounted(() => loadThemeAndData())

// 7. 交互动作
const submitMeme = () => {
  if (!newForm.value.term || !newForm.value.summary) return alert('不能为空哦！')
  localAdd({ ...newForm.value }) 
  showModal.value = false
  newForm.value = { term: '', summary: '', category: '默认' }
  loadThemeAndData() 
}

const goToDetail = (id) => {
  router.push(`/meme/${id}`)
}

const truncate = (text) => {
  if (!text) return ''
  return text.length > 10 ? text.slice(0, 10) + '…' : text
}

const categoryList = Object.keys(categoryConfig).filter(key => key !== '默认')
</script>

<template>
  <div class="app-container">
    <nav class="navbar">
      <div class="navbar-left">
        <div class="logo">
          <img src="/logo.png" alt="Logo" class="spark-logo" /> 
          梗查查
        </div>
      </div>
      
      <div class="nav-actions">
        <div class="color-dots" v-show="!isDark">
          <span class="dot pink" :class="{ active: currentBg === 'pink' }" @click="setBgColor('pink')" title="猛男落泪粉"></span>
          <span class="dot green" :class="{ active: currentBg === 'green' }" @click="setBgColor('green')" title="护眼绿豆沙"></span>
          <span class="dot default" :class="{ active: currentBg === 'default' }" @click="setBgColor('default')" title="默认白"></span>
        </div>

        <button class="theme-toggle-btn" @click="toggleTheme">
          {{ isDark ? '🌙 ' : '☀️ ' }}
        </button>
        <button class="add-btn" @click="showModal = true">➕ </button>
      </div>
    </nav>

    <header class="hero">
      <div class="search-wrapper">
        <div class="search-box">
          <input 
            v-model="inputText" 
            type="text" 
            placeholder="输入后按回车搜索 " 
            class="search-input"
            @focus="showHistory = true" 
            @blur="showHistory = false" 
            @keyup.enter="executeSearch"
            @input="handleInput"
          />
          <div @click="executeSearch" style="cursor:pointer; display:flex; align-items:center; padding-right:15px;">
            🔍
          </div>
        </div>

        <div class="history-dropdown" v-if="showHistory && searchHistory.length > 0">
          <div class="history-header">
            <span class="history-title">最近搜索</span>
            <span class="clear-btn" @mousedown.prevent="clearHistory">🗑️ 清空</span>
          </div>
          <ul class="history-list">
            <li v-for="item in searchHistory" 
                :key="item" 
                @mousedown.prevent="selectHistory(item)">
              🕒 {{ item }}
            </li>
          </ul>
        </div>
      </div>
    </header>

    <main class="hot-list">
      <div class="section-header">
        <h2 class="section-title">{{ activeSearch ? `🔍 搜索结果` : '🎲 猜你想看' }}</h2>
        <div class="section-controls">
          <button v-if="!activeSearch" class="section-btn refresh-random-btn" @click="refreshRandomMemes">
            换一换 🔄
          </button>
        </div>
      </div>
      


      <div class="card-grid">
        <div class="card" v-for="(meme, index) in filteredMemes" :key="meme.id" @click="goToDetail(meme.id)"
          :style="blacklistIds.includes(meme.id) ? { opacity: 0.4, filter: 'grayscale(1)', borderStyle: 'dashed' } : {}">
          <div class="card-top">
            <div class="meme-info">
              <h3 class="meme-term">{{ truncate(meme.term) }}
                <span v-if="blacklistIds.includes(meme.id)" style="font-size:10px; opacity:0.6; margin-left:5px;">(已屏蔽)</span>
              </h3>
            </div>
            <div class="card-actions">
              <button class="action-btn fav-btn small-btn" :class="{ 'active': favoriteIds.includes(meme.id) }" @click.stop="toggleFavorite(meme.id)">
                {{ favoriteIds.includes(meme.id) ? '⭐ ' : '☆ ' }}
              </button>
              <button class="action-btn like-btn small-btn" @click.stop="toggleLike(meme.id)">
                {{ likedIds.includes(meme.id) ? '❤️ ' : '🤍 ' }}
              </button>            
            </div>
          </div>
        </div>
      </div>
    </main>

    <div v-if="showModal" class="modal-overlay">
      <div class="modal-content">
        <h3>贡献新梗</h3>
        <input v-model="newForm.term" placeholder="名字" class="modal-input" />
        <select v-model="newForm.category" class="modal-input">
          <option value="默认">选择分类...</option>
          <option v-for="name in categoryList" :key="name" :value="name">
            {{ categoryConfig[name].icon }} {{ name }}
          </option>
        </select>
        <textarea 
          v-model="newForm.summary" 
          placeholder="解释一下..." 
          class="modal-textarea"
        ></textarea>

        <textarea 
          v-model="newForm.details" 
          placeholder="详细科普 (起源、背景故事、具体用法...)" 
          class="modal-textarea detail-field"
        ></textarea>

        <div class="modal-actions">
          <button class="cancel-btn" @click="showModal = false">取消</button>
          <button class="submit-btn" @click="submitMeme">提交</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
:global(html) {
  transition: background-color 0.4s ease;
}
:global(.bg-pink) { background-color: #FFE4E1 !important; }
:global(.bg-green) { background-color: #C7EDCC !important; }

:global(html.dark-mode) {
  background-color: #121212 !important; 
}

.app-container { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: transparent !important; min-height: 100vh; transition: background-color 0.3s; }
.navbar { max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; padding: 12px 20px; gap: 20px; }
.logo { font-size: 20px; font-weight: bold; color: var(--text-main); display: flex;align-items: center;gap: 8px;}
.spark-logo { width: 1.5em;  height: 1.5em;  object-fit: contain; position: relative;top: 1px;}

.add-btn { background-color: #FFD700; border: none; padding: 6px 14px; border-radius: 20px; font-weight: bold; cursor: pointer; color: #333; }

.nav-actions { display: flex; align-items: center; gap: 10px; }

.color-dots { display: flex; gap: 6px; align-items: center; margin-right: 4px; }
.dot { display: inline-block; width: 18px; height: 18px; border-radius: 50%; cursor: pointer; border: 2px solid transparent; transition: transform 0.2s, border-color 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
.dot:hover { transform: scale(1.2); }
.dot.active { border-color: var(--text-main); transform: scale(1.15); }
.dot.pink { background-color: #ffb6c1; }
.dot.green { background-color: #8fbc8f; }
.dot.default { background-color: #f5f5f5; border: 1px solid #ddd; }

.theme-toggle-btn { background-color: var(--card-bg); color: var(--text-main); border: 1px solid var(--border-color); padding: 6px 12px; border-radius: 20px; font-size: 13px; font-weight: bold; cursor: pointer; transition: all 0.3s; }
.theme-toggle-btn:hover { background-color: var(--bg-color); }

.hero { padding: 20px; text-align: center; margin-bottom: 20px; }

.search-wrapper { position: relative; max-width: 600px; margin: 0 auto; width: 100%; }
.search-box { display: flex; background: var(--card-bg,#ffffff); border-radius: 30px; padding: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); width: 100%; border: 1px solid var(--border-color); }
.search-input { flex: 1; border: none; padding: 10px 20px; font-size: 15px; border-radius: 30px; outline: none; background: transparent; color: var(--text-main); }

.history-dropdown { position: absolute; top: 55px; left: 0; width: 100%; background: var(--card-bg,#ffffff); border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.15); z-index: 100; overflow: hidden; text-align: left; border: 1px solid var(--border-color); }
.history-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 20px; background-color: var(--bg-color); font-size: 13px; color: var(--text-secondary); }
.clear-btn { cursor: pointer; color: #ff4757; font-weight: bold; transition: opacity 0.2s; }
.clear-btn:hover { opacity: 0.8; }
.history-list { list-style: none; margin: 0; padding: 0; }
.history-list li { padding: 14px 20px; font-size: 15px; color: var(--text-main); cursor: pointer; transition: background 0.2s; }
.history-list li:hover { background-color: var(--bg-color); }

.hot-list { max-width: 1200px; margin: 0 auto; padding: 10px 20px; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.section-title { font-size: 18px; font-weight: bold; margin: 0; color: var(--text-main); }
.section-controls { display: flex; gap: 8px; align-items: center; }
.section-btn { background-color: var(--bg-color); border: 1px solid var(--border-color); padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: bold; color: var(--text-main); cursor: pointer; transition: background-color 0.2s; display: inline-flex; align-items: center; gap: 4px; }
.refresh-random-btn:hover { filter: brightness(0.9); }

/* 💡 新增：空状态样式 */
.empty-state {
  text-align: center;
  padding: 50px 20px;
  color: var(--text-secondary, #888);
  font-size: 16px;
  background: var(--card-bg);
  border: 1px dashed var(--border-color);
  border-radius: 12px;
  margin-top: 10px;
}

.card-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
.card { background: var(--card-bg) !important; border: 1px solid var(--border-color); border-radius: 10px; padding: 10px 12px; box-shadow: 0 3px 6px rgba(0,0,0,0.04); cursor: pointer; color: var(--text-main); }
.card-top { display: flex; align-items: center; gap: 10px; justify-content: space-between; }
.card-actions { display: flex; gap: 8px; }

.meme-info { flex: 1; display: flex; align-items: center; }
.meme-term { font-size: 14px; font-weight: 700; margin: 0 !important; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-main); }
.small-btn { width: 76px; padding: 6px 8px; font-size: 12px; }

.action-btn { border: none; padding: 6px 10px; border-radius: 12px; font-size: 12px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px; width: auto; flex-shrink: 0; transition: all 0.2s; }
.fav-btn { background-color: rgba(74, 144, 226, 0.1); color: #4a90e2; }
.like-btn { background-color: rgba(255, 143, 0, 0.1); color: #ff8f00; }

@media (min-width: 768px) { .card-grid { grid-template-columns: repeat(2, 1fr); gap: 20px; } }
@media (min-width: 1024px) { .card-grid { grid-template-columns: repeat(3, 1fr); } }

.modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background-color: rgba(0, 0, 0, 0.6); backdrop-filter: blur(3px); display: flex; justify-content: center; align-items: center; z-index: 2000; }
.modal-content { 
  background: var(--card-bg); 
  width: 90%; 
  max-width: 480px; 
  padding: 24px; 
  border-radius: 16px; 
  box-shadow: 0 10px 30px rgba(0,0,0,0.2); 
  display: flex; 
  flex-direction: column; 
  gap: 12px; 
  animation: modal-pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); 
  border: 1px solid var(--border-color); 
}
.detail-field {
  min-height: 180px; 
  line-height: 1.6;     
  font-size: 14px;
}
@keyframes modal-pop { 0% { transform: scale(0.8); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }

.modal-input, .modal-textarea { 
  width: 100%; 
  padding: 10px 12px; 
  border: 1px solid var(--border-color);
  border-radius: 10px; 
  font-size: 14px; 
  background-color: var(--bg-color); 
  color: var(--text-main); 
  box-sizing: border-box; 
  outline: none; 
  font-family: inherit; 
  transition: border-color 0.2s; 
}
.modal-input:focus, .modal-textarea:focus { border-color: #FFD700; background-color: var(--card-bg); }
.modal-textarea { resize: vertical; min-height: 60px; }
.modal-actions { display: flex; justify-content: space-between; gap: 12px; margin-top: 10px; }
.cancel-btn, .submit-btn { flex: 1; border: none; padding: 12px; border-radius: 10px; cursor: pointer; font-size: 15px; font-weight: bold; }
.cancel-btn { 
  background-color: var(--bg-color); 
  color: var(--text-main); 
  border: 1px solid var(--border-color); 
}
.submit-btn { background-color: #FFD700; color: #333; }
.modal-content h3 {
  margin: 0;
  color: var(--text-main);
}
:global(html.dark-mode) .hero {
  filter: brightness(0.8) contrast(1.1);
}
</style>