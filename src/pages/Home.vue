<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getMemes, addMeme as localAdd, deleteMeme as localDelete } from '../db.js'
import { favoriteIds, toggleFavorite, notInterestedIds, markNotInterested, randomMemes, likedIds, toggleLike } from '../store.js'

const router = useRouter()
const hotMemes = ref([])

// 🌟 核心修改：将输入框的值和实际搜索的值分开
const inputText = ref('')     // 绑定给输入框（用户正在打字，但不立刻搜）
const activeSearch = ref('')  // 真正用来过滤列表的词（按下回车后才更新）

const showModal = ref(false)
const newForm = ref({ term: '', summary: '', category: '默认' })

const searchHistory = ref(JSON.parse(localStorage.getItem('searchHistory') || '[]'))
const showHistory = ref(false)

// 🌟 修改：执行搜索时，更新 activeSearch 并保存历史
const executeSearch = () => {
  const term = inputText.value.trim()
  activeSearch.value = term // 只有执行了搜索，才把词交给下面去过滤列表！

  if (term) {
    searchHistory.value = searchHistory.value.filter(item => item !== term)
    searchHistory.value.unshift(term)
    if (searchHistory.value.length > 10) searchHistory.value.pop()
    localStorage.setItem('searchHistory', JSON.stringify(searchHistory.value))
  }
  showHistory.value = false 
}

const selectHistory = (term) => {
  inputText.value = term
  executeSearch()
}

const clearHistory = () => {
  searchHistory.value = []
  localStorage.removeItem('searchHistory')
}

// 如果用户清空了输入框的内容，我们最好也把搜索状态重置
const handleInput = () => {
  if (inputText.value.trim() === '') {
    activeSearch.value = ''
  }
}

const refreshRandomMemes = () => {
  const availableMemes = hotMemes.value.filter(meme => !notInterestedIds.value.includes(meme.id))
  const shuffled = [...availableMemes].sort(() => 0.5 - Math.random())
  randomMemes.value = shuffled.slice(0, 5)
  
  // 🌟 新增：把抽出来的 5 个词条的 ID 存进会话缓存
  const ids = randomMemes.value.map(m => m.id)
  sessionStorage.setItem('cachedRandomIds', JSON.stringify(ids))
}

const loadData = () => {
  hotMemes.value = getMemes()
  
  // 🌟 新增：尝试读取刚才存的 ID 记忆
  const cachedIds = JSON.parse(sessionStorage.getItem('cachedRandomIds') || 'null')
  
  if (cachedIds && cachedIds.length > 0) {
    // 如果有记忆，就把这 5 个老伙计重新捞出来
    const cachedMemes = hotMemes.value.filter(m => cachedIds.includes(m.id))
    // 再次过滤掉中途被点过“没意思”的
    randomMemes.value = cachedMemes.filter(m => !notInterestedIds.value.includes(m.id))
  } else if (randomMemes.value.length === 0) {
    // 如果没有任何记忆，才进行第一次随机抽取
    refreshRandomMemes()
  }
}

onMounted(() => loadData())

// 🌟 修改：用 activeSearch 来判断和过滤，而不是输入的实时内容
const filteredMemes = computed(() => {
  if (activeSearch.value.trim() === '') {
    return randomMemes.value.filter(meme => !notInterestedIds.value.includes(meme.id))
  }

  const keyword = activeSearch.value.toLowerCase()
  return hotMemes.value.filter(meme => 
    !notInterestedIds.value.includes(meme.id) && 
    (meme.term.includes(keyword) || (meme.pinyin && meme.pinyin.includes(keyword)))
  )
})

const submitMeme = () => {
  if (!newForm.value.term || !newForm.value.summary) return alert('不能为空哦！')
  localAdd({ ...newForm.value }) 
  showModal.value = false
  newForm.value = { term: '', summary: '', category: '默认' }
  loadData() 
}

const deleteMeme = (id) => {
  if (!confirm('确定要删除吗？')) return
  localDelete(id)
  loadData()
}

const goToDetail = (id) => {
  router.push(`/meme/${id}`)
}

// 获取当前是否是夜间模式，用来正确显示“白天/夜间”文字
const isDark = ref(localStorage.getItem('theme') === 'dark')

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
</script>

<template>
  <div class="app-container">
    <nav class="navbar">
      <div class="logo">🔥 梗百科</div>
      
      <div class="nav-actions">
        <button class="theme-toggle-btn" @click="toggleTheme">
          {{ isDark ? '🌙 夜间' : '☀️ 白天' }}
        </button>
        <button class="add-btn" @click="showModal = true">➕ 贡献</button>
      </div>
    </nav>

    <header class="hero">
      <h1 class="hero-title">全网热梗，一搜便知</h1>
      
      <div class="search-wrapper">
        <div class="search-box">
          <input 
            v-model="inputText" 
            type="text" 
            placeholder="输入后按回车搜索 (例如：xyb)" 
            class="search-input"
            @focus="showHistory = true" 
            @blur="showHistory = false" 
            @keyup.enter="executeSearch"
            @input="handleInput"
          />
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
        <button v-if="!activeSearch" class="refresh-random-btn" @click="refreshRandomMemes">
          换一换 🔄
        </button>
      </div>
      
      <div class="card-grid">
        <div class="card" v-for="(meme, index) in filteredMemes" :key="meme.id" @click="goToDetail(meme.id)">
          <div class="card-left">
            <span class="rank" :class="'rank-' + (index + 1)" v-if="!activeSearch">{{ index + 1 }}</span>
            <div class="meme-info">
              <h3 class="meme-term">{{ meme.term }}</h3>
            </div>
          </div>
          
          <div class="card-right">
            <button class="action-btn fav-btn" :class="{ 'active': favoriteIds.includes(meme.id) }" @click.stop="toggleFavorite(meme.id)">
              {{ favoriteIds.includes(meme.id) ? '⭐ 已收藏' : '☆ 收藏' }}
            </button>
            <button class="action-btn like-btn" :class="{ 'liked-active': likedIds.includes(meme.id) }" @click.stop="toggleLike(meme.id)">👍 点赞
            </button>
          </div>
        </div>
      </div>
    </main>

    <div v-if="showModal" class="modal-overlay">
      <div class="modal-content">
        <h3>贡献新梗</h3>
        <input v-model="newForm.term" placeholder="名字" class="modal-input" />
        <textarea v-model="newForm.summary" placeholder="解释一下..." class="modal-textarea"></textarea>
        <select v-model="newForm.category" class="modal-input">
          <option value="默认">选择分类...</option>
          <option value="萌系">萌系</option>
          <option value="科技">科技</option>
          <option value="二次元">二次元</option>
          <option value="方言">方言</option>
        </select>
        <div class="modal-actions">
          <button class="cancel-btn" @click="showModal = false">取消</button>
          <button class="submit-btn" @click="submitMeme">提交</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 💡 注意：我已经把里面写死的 #fff, #333, #f0f2f5 等全部替换成了 var() 全局变量 */

.app-container { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: var(--bg-color) !important; min-height: 100vh; padding-bottom: 80px; transition: background-color 0.3s; }
.navbar { max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; padding: 12px 20px; }
.logo { font-size: 20px; font-weight: 900; color: var(--text-main); }
.add-btn { background-color: #FFD700; border: none; padding: 6px 14px; border-radius: 20px; font-weight: bold; cursor: pointer; color: #333; }

/* 顶部醒目的黄色区域，夜间模式下我们会用滤镜稍微压暗它 */
.hero { padding: 20px 20px; background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); text-align: center; border-bottom-left-radius: 20px; border-bottom-right-radius: 20px; margin-bottom: 20px; transition: filter 0.3s; }
.hero-title { font-size: 22px; font-weight: 800; margin: 0 0 16px 0; color: #000; }

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
.refresh-random-btn { background-color: var(--bg-color); border: 1px solid var(--border-color); padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: bold; color: var(--text-main); cursor: pointer; transition: background-color 0.2s; }
.refresh-random-btn:hover { filter: brightness(0.9); }

.card-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
.card { display: flex !important; flex-direction: row !important; justify-content: space-between !important; align-items: center !important; background: var(--card-bg) !important; border: 1px solid var(--border-color); border-radius: 12px; padding: 16px 20px; box-shadow: 0 4px 8px rgba(0,0,0,0.04); cursor: pointer; color: var(--text-main); }
.card-left { display: flex !important; flex-direction: row !important; align-items: center !important; flex: 1; overflow: hidden; }
.card-right { display: flex !important; flex-direction: row !important; align-items: center !important; gap: 10px !important; margin-left: 10px; }
.rank { font-size: 18px; font-weight: 900; color: #bbb; width: 24px; margin-right: 12px; flex-shrink: 0; text-align: center; }
.rank-1 { color: #FF4500; font-size: 22px; }
.rank-2 { color: #FF8C00; font-size: 20px; }
.rank-3 { color: #FFA500; font-size: 18px; }
.meme-info { flex: 1; display: flex; align-items: center; }
.meme-term { font-size: 16px; font-weight: bold; margin: 0 !important; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-main); }

.action-btn { border: none; padding: 6px 0; border-radius: 12px; font-size: 12px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px; width: 85px; flex-shrink: 0; transition: all 0.2s; }
.not-interested-btn { width: 95px !important; background-color: var(--bg-color); color: var(--text-secondary); border: 1px solid var(--border-color); }
.fav-btn { background-color: rgba(74, 144, 226, 0.1); color: #4a90e2; }
.like-btn { background-color: rgba(255, 143, 0, 0.1); color: #ff8f00; }
.liked-active { background-color: #ffe0b2 !important; color: #e65100 !important; }

@media (min-width: 768px) { .card-grid { grid-template-columns: repeat(2, 1fr); gap: 20px; } }
@media (min-width: 1024px) { .card-grid { grid-template-columns: repeat(3, 1fr); } }

.modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background-color: rgba(0, 0, 0, 0.6); backdrop-filter: blur(3px); display: flex; justify-content: center; align-items: center; z-index: 2000; }
.modal-content { background: var(--card-bg); width: 90%; max-width: 360px; padding: 24px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); display: flex; flex-direction: column; gap: 12px; animation: modal-pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
@keyframes modal-pop { 0% { transform: scale(0.8); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
.modal-content h3 { margin: 0 0 10px 0; color: var(--text-main); text-align: center; font-size: 20px; font-weight: 900; }
.modal-input, .modal-textarea { width: 100%; padding: 12px 14px; border: 1px solid var(--border-color); border-radius: 10px; font-size: 14px; background-color: var(--bg-color); color: var(--text-main); box-sizing: border-box; outline: none; font-family: inherit; transition: border-color 0.2s; }
.modal-input:focus, .modal-textarea:focus { border-color: #FFD700; background-color: var(--card-bg); }
.modal-textarea { resize: vertical; min-height: 80px; }
.modal-actions { display: flex; justify-content: space-between; gap: 12px; margin-top: 10px; }
.cancel-btn, .submit-btn { flex: 1; border: none; padding: 12px; border-radius: 10px; cursor: pointer; font-size: 15px; font-weight: bold; }
.cancel-btn { background-color: var(--bg-color); color: var(--text-secondary); border: 1px solid var(--border-color); }
.submit-btn { background-color: #FFD700; color: #333; }
.cancel-btn:active, .submit-btn:active { transform: scale(0.96); }

/* 🌟 右侧按钮组的排版 */
.nav-actions { display: flex; align-items: center; gap: 12px; }

/* 🌟 主题切换按钮样式 */
.theme-toggle-btn {
  background-color: var(--card-bg);
  color: var(--text-main);
  border: 1px solid var(--border-color);
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
}
.theme-toggle-btn:hover { background-color: var(--bg-color); }

/* 💡 终极护眼魔法：夜间模式下，稍微把黄色的海报压暗一点，不然会刺眼 */
:global(html.dark-mode) .hero {
  filter: brightness(0.8) contrast(1.1);
}
</style>