<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getMemes, addMeme as localAdd} from '../db.js'
import { favoriteIds, toggleFavorite, blacklistIds, randomMemes, likedIds, toggleLike } from '../store.js'
import { categoryConfig } from '../categories' 
import{pinyin} from 'pinyin-pro'

const router = useRouter()
const hotMemes = ref([]) // 真正的所有梗的数据源

// 🌟 搜索相关状态
const inputText = ref('')     
const activeSearch = ref('')  
const searchHistory = ref(JSON.parse(localStorage.getItem('searchHistory') || '[]'))
const showHistory = ref(false)
const isRefreshing = ref(false)
const pullDistance = ref(0)
let startY = 0
let lastY = 0

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

/**
 * 核心匹配引擎
 * @param {Object} meme 梗对象
 * @param {String} query 搜索关键词
 */
const checkMatch = (meme, query) => {
  // 1. 标准化处理：转小写并去除所有空格
  const q = query.toLowerCase().replace(/\s+/g, '');
  if (!q) return false;

  const term = meme.term.toLowerCase().replace(/\s+/g, '');
  
  // 2. 直接匹配 (汉字或原词)
  if (term.includes(q)) return true;

  // 3. 拼音全拼匹配 (例如: xianyanbao)
  // nonChinese: 'keep' 保持非中文字符(如打call中的call)
  const fullPinyin = pinyin(meme.term, { 
    toneType: 'none', 
    type: 'array',
    nonChinese: 'keep' 
  }).join('').toLowerCase().replace(/\s+/g, '');
  
  if (fullPinyin.includes(q)) return true;

  // 4. 拼音首字母匹配 (例如: xyb)
  const initials = pinyin(meme.term, { 
    pattern: 'first', 
    toneType: 'none', 
    type: 'array',
    nonChinese: 'keep'
  }).join('').toLowerCase().replace(/\s+/g, '');

  if (initials.includes(q)) return true;

  return false;
}

const selectHistory = (term) => {
  inputText.value = term
  executeSearch()
}

const clearHistory = () => {
  searchHistory.value = []
  localStorage.removeItem('searchHistory')
}

const scrollContainer = ref(null)

const handleTouchStart = (e) => {
  lastY = e.touches[0].pageY // 记录初始位置
  
  const scrollDom = document.querySelector('.hot-list')
  const scrollTop = scrollDom?.scrollTop || 0

  if (scrollTop <= 0) {
    startY = e.touches[0].pageY
  } else {
    startY = -1 // 标记当前不在顶部，不触发下拉
  }
}

const handleTouchMove = (e) => {
  const currentY = e.touches[0].pageY
  const diffY = currentY - lastY // diffY < 0 表示向上滑，> 0 表示向下滑
  lastY = currentY // 更新实时坐标

  const scrollDom = document.querySelector('.hot-list')

  // 1. 处理顶部的下拉刷新逻辑
  if (startY !== -1) {
    const diffFromStart = currentY - startY
    if (diffFromStart > 0) {
      pullDistance.value = Math.min(diffFromStart * 0.5, 80)
      if (pullDistance.value > 10 && e.cancelable) {
        e.preventDefault() // 阻止浏览器下拉露出顶部白底
      }
      return // 如果处于下拉刷新状态，直接返回，跳过后续检测
    }
  }

  // 2. 🌟 核心：处理底部的越界上滑（防止露出底部白底）
  if (scrollDom) {
    // 判断是否已经滚动到了底部（容差 1px 避免精度问题）
    const isAtBottom = scrollDom.scrollHeight - scrollDom.scrollTop <= scrollDom.clientHeight + 1

    // 如果在底部，且用户还在继续向上滑动，立刻拦截！
    if (isAtBottom && diffY < 0) {
      if (e.cancelable) e.preventDefault()
    }
  }
}

const handleTouchEnd = async () => {
  if (pullDistance.value >= 60) {
    isRefreshing.value = true
    pullDistance.value = 40 // 悬停在刷新状态
    
    // 执行你原有的刷新函数
    if (typeof refreshRandomMemes === 'function') {
      await refreshRandomMemes()
    } else {
      // 如果没有该函数，模拟一个延迟
      await new Promise(resolve => setTimeout(resolve, 800))
    }
    isRefreshing.value = false
  }
  pullDistance.value = 0
}

const refreshStatusText = computed(() => {
  if (isRefreshing.value) return '正在更新梗库...'
  if (pullDistance.value > 60) return '松开立即刷新'
  return '下拉发现新梗'
})


// 在 script setup 顶部定义已阅池（或者从 localStorage 读取实现持久化）
const viewedIds = ref(JSON.parse(localStorage.getItem('viewedIds') || '[]'))

// 🌟 新增：动态计算每屏展示数量
const calculateDisplayCount = () => {
  const vh = window.innerHeight;
  const isMobile = window.innerWidth < 768;
  
  // 减去导航栏(约60px)和搜索区域(约140px)和标题(约50px)
  const availableHeight = vh - 330; 
  const cardHeight = 54; // 紧凑型卡片高度（含gap）
  
  const rows = Math.floor(availableHeight / cardHeight);
  const cols = isMobile ? 1 : (window.innerWidth < 1024 ? 2 : 3);
  
  return Math.max(rows * cols, isMobile ? 4 : 6); // 保证至少显示6个
}

const displayCount = ref(10); // 默认值

// 3. 🎲 刷新猜你想看列表
const refreshRandomMemes = () => {
  displayCount.value = calculateDisplayCount(); // 刷新时重新计算空间
  
  const availableMemes = hotMemes.value.filter(meme => !blacklistIds.value.includes(meme.id))
  let unviewed = availableMemes.filter(meme => !viewedIds.value.includes(meme.id))
  
  // 如果剩下的不够一屏了，重置已阅池
  if (unviewed.length < displayCount.value) {
    viewedIds.value = []
    unviewed = availableMemes
  }
  
  const shuffled = [...unviewed].sort(() => 0.5 - Math.random())
  // 🌟 这里改为根据 displayCount 截取
  let picked = shuffled.slice(0, displayCount.value)
  
  // 保持词条长短交错的视觉感
  picked.sort((a,b) => a.term.length - b.term.length)
  
  randomMemes.value = picked
  const ids = picked.map(m => m.id)
  
  const currentTotalViewed = JSON.parse(localStorage.getItem('viewedIds') || '[]')
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
  <div class="app-container"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"  >

    <div class="pull-down-refresh" :style="{ height: pullDistance + 'px', opacity: pullDistance > 10 ? 1 : 0 }">
      <div class="refresh-content">
        <span v-if="!isRefreshing" class="refresh-icon" :style="{ transform: `rotate(${pullDistance * 3}deg)` }">
          {{ pullDistance > 60 ? '✨' : '👇' }}
        </span>
        <span v-else class="refresh-spinner">🌀</span>
        <span class="refresh-text">{{ refreshStatusText }}</span>
      </div>
    </div>

    <nav class="navbar">
      <div class="navbar-left">
        <div class="logo">
          <img src="/Home-logo.png" alt="Logo" class="spark-logo" /> 
          梗查查
        </div>
      </div>
      
      <div class="nav-actions">
        <div class="color-dots" v-show="!isDark">
          <span class="dot pink" :class="{ active: currentBg === 'pink' }" @click.stop="setBgColor('pink')" title="猛男落泪粉"></span>
          <span class="dot green" :class="{ active: currentBg === 'green' }" @click.stop="setBgColor('green')" title="护眼绿豆沙"></span>
          <span class="dot default" :class="{ active: currentBg === 'default' }" @click.stop="setBgColor('default')" title="默认白"></span>
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
                @mousedown.prevent="selectHistory(item)"
                @touchstart.prevent="selectHistory(item)">
              🕒 {{ item }}
            </li>
          </ul>
        </div>
      </div>
    </header>

    <main class="hot-list" ref="scrollContainer">
      <div class="section-header">
        <h2 class="section-title">{{ activeSearch ? `🔍 搜索结果` : '🎲 猜你想看' }}</h2>
        <div class="section-controls">
          <button v-if="!activeSearch" class="section-btn refresh-random-btn" @click="refreshRandomMemes">
            换一换 🔄
          </button>
        </div>
      </div>
      


      <div class="card-grid">
        <div class="card" v-for="(meme, index) in filteredMemes" :key="meme.id" @click="goToDetail(meme.id)">
          <div class="card-top">
            <div class="meme-info">
              <h3 class="meme-term">{{ truncate(meme.term) }}
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

      <footer class="page-footer">
        <p>温馨提示：适度玩梗，理智吃瓜</p>
        <p>本站内容均来自网络收集或用户贡献，若内容有误或存在侵权，欢迎联系提出修改</p>
      </footer>
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
  /* 👇 核心修复：补全丢失的亮色模式颜色变量 */
  --bg-color: #F5F6FA;
  --card-bg: #FFFFFF;
  --text-main: #333333;
  --border-color: #E4E6EB;
  --text-secondary: #888888;
}

:global(html.dark-mode) {
  background-color: #121212 !important; 
  /* 👇 核心修复：补全丢失的暗黑模式颜色变量 */
  --bg-color: #121212;
  --card-bg: #1E1E1E;
  --text-main: #FFFFFF;
  --border-color: #2C2C2C;
  --text-secondary: #AAAAAA;
}

:global(html), :global(body) {
  overscroll-behavior: none; /* 核心：彻底禁用浏览器的橡皮筋回弹效果 */
  margin: 0;
  padding: 0;
}
:global(.bg-pink) { background-color: #FFE4E1 !important; }
:global(.bg-green) { background-color: #C7EDCC !important; }

.app-container { 
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
  height: 100vh !important; 
  overflow: hidden !important; 
  background-color: transparent !important; 
  transition: background-color 0.3s; 
  overflow-x: hidden; 
  overscroll-behavior-y: contain; 
  /* 👇 核心：动态加上底部的安全距离 */
  padding-bottom: max(80px, calc(env(safe-area-inset-bottom) + 80px)); 
  box-sizing: border-box; 
  flex-direction: column;
}

.navbar { 
  margin: 0 auto; 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  /* 👇 核心：动态给顶部、左侧、右侧留出安全区 */
  padding-top: max(10px, env(safe-area-inset-top));
  padding-bottom: 10px;
  padding-left: max(20px, env(safe-area-inset-left));
  padding-right: max(20px, env(safe-area-inset-right));
  gap: 20px; 
  flex-shrink: 0;
}

.logo { font-size: 18px; font-weight: bold; color: var(--text-main); display: flex; align-items: center; gap: 4px; }
.spark-logo { width: 2.2em; height: 2.2em; object-fit: contain; position: relative; top: 1px; }

.add-btn { background-color: #FFD700; border: none; padding: 6px 8px; border-radius: 20px; font-weight: bold; cursor: pointer; color: #333; -webkit-tap-highlight-color: transparent;}

.nav-actions { display: flex; align-items: center; gap: 8px; z-index: 100; }

.color-dots { display: flex; gap: 8px; align-items: center; margin-right: 4px; }
.dot { display: inline-block; width: 22px; height: 22px; border-radius: 50%; cursor: pointer; border: 2px solid transparent; transition: all 0.2s ease, border-color 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.1); -webkit-tap-highlight-color: transparent;}
.dot:hover { transform: scale(1.2); }
.dot.active { border-color: var(--text-main); transform: scale(1.15); }
.dot.pink { background-color: #ffb6c1; }
.dot.green { background-color: #8fbc8f; }
.dot.default { background-color: #f5f5f5; }

.theme-toggle-btn { background-color: var(--card-bg); color: var(--text-main); border: 1px solid var(--border-color); padding: 6px 8px; border-radius: 20px; font-size: 13px; font-weight: bold; cursor: pointer; transition: all 0.3s; -webkit-tap-highlight-color: transparent; }
.theme-toggle-btn:active, .add-btn:active {
  background-color: var(--bg-color) !important;
  transform: scale(0.9);
}
.theme-toggle-btn, .add-btn {
  font-size: 13px;
  line-height: 1;
  border: 1px solid var(--border-color);
  background-color: var(--card-bg) !important; 
  color: var(--text-main);
  outline: none; 
}

.dot, .theme-toggle-btn, .add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-sizing: border-box;
  flex-shrink: 0;
  transition: all 0.2s ease;
  -webkit-tap-highlight-color: transparent; /* 移除移动端点击高亮蓝框 */
}

.hero { padding: 10px 20px; text-align: center; margin-bottom: 5px; flex-shrink: 0; }

.search-wrapper { position: relative; max-width: 600px; margin: 0 auto; width: 100%; }
.search-box { display: flex; background: var(--card-bg, #ffffff); border-radius: 30px; padding: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); width: 100%; border: 1px solid var(--border-color); }
.search-input { flex: 1; border: none; padding: 10px 20px; font-size: 15px; border-radius: 30px; outline: none; background: transparent; color: var(--text-main); }

.history-dropdown { position: absolute; top: 55px; left: 0; width: 100%; background: var(--card-bg, #ffffff); border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.15); z-index: 100; overflow: hidden; text-align: left; border: 1px solid var(--border-color); }
.history-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 20px; background-color: var(--bg-color); font-size: 13px; color: var(--text-secondary); }
.clear-btn { cursor: pointer; color: #ff4757; font-weight: bold; transition: opacity 0.2s; }
.clear-btn:hover { opacity: 0.8; }
.history-list { list-style: none; margin: 0; padding: 0; }
.history-list li { padding: 14px 20px; font-size: 15px; color: var(--text-main); cursor: pointer; transition: background-color 0.2s; }
.history-list li:hover { background-color: var(--bg-color); }

.hot-list { flex: 1; margin: 0 auto; padding: 10px 20px; flex-direction: column; display: flex; box-sizing: border-box; overflow-y: auto; -webkit-overflow-scrolling: touch; overscroll-behavior-y: none; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; flex-shrink: 0;}
.section-title { font-size: 18px; font-weight: bold; margin: 0; color: var(--text-main); }
.section-controls { display: flex; gap: 8px; align-items: center; }
.section-btn { background-color: transparent; padding: 6px 14px; border: 1px solid transparent; outline: none; border-radius: 20px; font-size: 13px; font-weight: bold; color: var(--text-main); cursor: pointer; transition: background-color 0.2s; display: inline-flex; align-items: center; gap: 4px; }
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

.card-grid { display: grid; grid-template-columns: 1fr; gap: 10px; align-content: start; }
.card { background: var(--card-bg) !important; border: 1px solid var(--border-color); border-radius: 8px; padding: 8px 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.04); cursor: pointer; color: var(--text-main); -webkit-tap-highlight-color: transparent; user-select: none; outline: none; }
.card-top { width: 100%; display: flex; align-items: center; gap: 10px; justify-content: space-between; }
.card-actions { display: flex; gap: 8px; }
.card:active, .card:focus {
  outline: none;
  -webkit-tap-highlight-color: transparent;
}

.meme-info { flex: 1; display: flex; align-items: center; }
.meme-term { font-size: 14px; font-weight: 700; margin: 0 !important; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-main); }
.small-btn { width: 70px; height: 28px; font-size: 14px; padding: 0; }

.action-btn { border: none; padding: 0px 10px; border-radius: 8px; font-size: 11px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px; width: auto; flex-shrink: 0; transition: all 0.2s; box-sizing: border-box;}
.fav-btn { background-color: rgba(74, 144, 226, 0.1); color: #4a90e2; }
.like-btn { background-color: rgba(255, 143, 0, 0.1); color: #ff8f00; }

@media (min-width: 768px) { 
  .card-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; } 
  .hot-list { max-width: 800px; }
}
@media (min-width: 1024px) { 
  .card-grid { grid-template-columns: repeat(3, 1fr); } 
  .hot-list { max-width: 1000px; } 
}

.modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background-color: rgba(0, 0, 0, 0.6); backdrop-filter: blur(3px); display: flex; justify-content: center; align-items: center; z-index: 2000; }
.modal-content { 
  background: var(--card-bg); 
  width: 90%; 
  max-width: 480px; 
  padding: 24px; 
  padding-bottom: max(24px, calc(env(safe-area-inset-bottom) + 10px)); /* 给底部留出安全距离 */
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

.pull-down-refresh {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background-color: transparent;
  transition: height 0.2s ease-out;
  pointer-events: none; 
  flex-shrink: 0;
}

.refresh-content {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 600;
}

.refresh-icon {
  font-size: 18px;
  display: inline-block;
  transition: transform 0.1s;
}

.refresh-spinner {
  font-size: 18px;
  display: inline-block;
  animation: spin 0.8s linear infinite;
}

.page-footer {
  margin-top: auto;
  text-align: center;
  padding: 20px 10px 10px;
  opacity: 0.6;
  flex-shrink: 0;
} 

.page-footer p {
  font-size: 11px;
  color: var(--text-secondary);
  line-height: 1.5;
  margin: 4px 0;
}

@media (max-width: 768px) {
  .page-footer { padding-bottom: 20px; }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>