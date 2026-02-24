<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getMemes, addMeme as localAdd, deleteMeme as localDelete } from '../db.js'
import { favoriteIds, toggleFavorite, notInterestedIds, markNotInterested,randomMemes,likedIds, toggleLike } from '../store.js'

const router = useRouter()
const hotMemes = ref([])
const searchQuery = ref('')
const showModal = ref(false)

const newForm = ref({ term: '', summary: '', category: '默认' })

// 🎲 核心逻辑：从“没被屏蔽”的总库里随机抽 5 个
const refreshRandomMemes = () => {
  // 先把没被屏蔽的挑出来
  const availableMemes = hotMemes.value.filter(meme => !notInterestedIds.value.includes(meme.id))
  // 打乱顺序并截取前 5 个
  const shuffled = [...availableMemes].sort(() => 0.5 - Math.random())
  randomMemes.value = shuffled.slice(0, 5)
}

// ⭐️ 改用本地方法加载数据
const loadData = () => {
  hotMemes.value = getMemes()
  if (randomMemes.value.length === 0) {
    refreshRandomMemes()
  }
}

onMounted(() => loadData())

// 🔍 智能切换列表
const filteredMemes = computed(() => {
  if (searchQuery.value.trim() === '') {
    // 1. 如果没有搜索关键词，展示抽出的 5 个（同时确保这 5 个里如果有刚刚被点“减少推荐”的，立刻隐藏）
    return randomMemes.value.filter(meme => !notInterestedIds.value.includes(meme.id))
  }

  // 2. 如果有关键词，在“没被屏蔽”的【全部】列表里进行搜索
  const keyword = searchQuery.value.toLowerCase()
  return hotMemes.value.filter(meme => 
    !notInterestedIds.value.includes(meme.id) && 
    (meme.term.includes(keyword) || (meme.pinyin && meme.pinyin.includes(keyword)))
  )
})

// ⭐️ 改用本地方法提交
const submitMeme = () => {
  if (!newForm.value.term || !newForm.value.summary) return alert('不能为空哦！')
  localAdd({ ...newForm.value }) // 保存到本地硬盘
  showModal.value = false
  newForm.value = { term: '', summary: '', category: '默认' }
  loadData() // 刷新列表
}

// ⭐️ 改用本地方法删除
const deleteMeme = (id) => {
  if (!confirm('确定要删除吗？')) return
  localDelete(id)
  loadData()
}

const goToDetail = (id) => {
  router.push(`/meme/${id}`)
}
</script>

<template>
  <div class="app-container">
    <nav class="navbar">
      <div class="logo">🔥 梗百科</div>
      <button class="add-btn" @click="showModal = true">➕ 贡献</button>
    </nav>

    <header class="hero">
      <h1 class="hero-title">全网热梗，一搜便知</h1>
      <div class="search-box">
        <input v-model="searchQuery" type="text" placeholder="试试搜汉字或拼音，比如：xyb" class="search-input" />
      </div>
    </header>

    <main class="hot-list">
      <div class="section-header">
        <h2 class="section-title">{{ searchQuery ? `🔍 搜索结果` : '🎲 猜你想看' }}</h2>
        <button v-if="!searchQuery" class="refresh-random-btn" @click="refreshRandomMemes">
          换一换 🔄
        </button>
      </div>
      
      <div class="card-grid">
        <div class="card" v-for="(meme, index) in filteredMemes" :key="meme.id" @click="goToDetail(meme.id)">
          <div class="card-left">
            <span class="rank" :class="'rank-' + (index + 1)" v-if="!searchQuery">{{ index + 1 }}</span>
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
            <button class="action-btn not-interested-btn" @click.stop="markNotInterested(meme.id)">🙈 减少推荐</button>
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
/* 原有样式保持不变... */
.app-container { 
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
  background-color: #f0f2f5 !important; 
  min-height: 100vh;
  padding-bottom: 80px;
}

.navbar { max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; padding: 12px 20px; }
.logo { font-size: 20px; font-weight: 900; color: #333; }
.add-btn { background-color: #FFD700; border: none; padding: 6px 14px; border-radius: 20px; font-weight: bold; cursor: pointer; color: #333; }

.hero { 
  padding: 20px 20px; 
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); 
  text-align: center; 
  border-bottom-left-radius: 20px; 
  border-bottom-right-radius: 20px;
  margin-bottom: 20px;
}
.hero-title { font-size: 22px; font-weight: 800; margin: 0 0 16px 0; color: #000; }

.search-box { 
  display: flex; background: #fff; border-radius: 30px; padding: 4px; 
  box-shadow: 0 4px 12px rgba(0,0,0,0.1); max-width: 600px; margin: 0 auto; 
}
.search-input { flex: 1; border: none; padding: 10px 20px; font-size: 15px; border-radius: 30px; outline: none; background: transparent; }

.hot-list { max-width: 1200px; margin: 0 auto; padding: 10px 20px; }

/* 🌟 新增：标题与换一换按钮的排版 */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.section-title { font-size: 18px; font-weight: bold; margin: 0; color: #333; }
.refresh-random-btn {
  background-color: #e4e6eb;
  border: none;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: bold;
  color: #333;
  cursor: pointer;
  transition: background-color 0.2s;
}
.refresh-random-btn:hover { background-color: #d1d4d9; }

/* 卡片和内容排版 */
.card-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }

.card { 
  display: flex !important; 
  flex-direction: row !important; 
  justify-content: space-between !important; 
  align-items: center !important; 
  background: #ffffff !important; 
  border: 1px solid #e4e6eb; 
  border-radius: 12px; 
  padding: 16px 20px; 
  box-shadow: 0 4px 8px rgba(0,0,0,0.04); 
  cursor: pointer; 
}

.card-left { display: flex !important; flex-direction: row !important; align-items: center !important; flex: 1; overflow: hidden; }
.card-right { display: flex !important; flex-direction: row !important; align-items: center !important; gap: 10px !important; margin-left: 10px; }

/* 序号样式 */
.rank { font-size: 18px; font-weight: 900; color: #bbb; width: 24px; margin-right: 12px; flex-shrink: 0; text-align: center; }
.rank-1 { color: #FF4500; font-size: 22px; }
.rank-2 { color: #FF8C00; font-size: 20px; }
.rank-3 { color: #FFA500; font-size: 18px; }

.meme-info { flex: 1; display: flex; align-items: center; }
.meme-term { font-size: 16px; font-weight: bold; margin: 0 !important; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #333; }

/* 按钮统一风格 */
.action-btn {
  border: none; padding: 6px 0; border-radius: 12px; font-size: 12px; font-weight: bold;
  cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;
  width: 85px; flex-shrink: 0; transition: all 0.2s;
}
.not-interested-btn { width: 95px !important; background-color: #f1f2f5; color: #666; }
.fav-btn { background-color: #f0f4f8; color: #4a90e2; }
.like-btn { background-color: #fff8e1; color: #ff8f00; }
.liked-active { 
  background-color: #ffe0b2 !important; 
  color: #e65100 !important; 
}

@media (min-width: 768px) { .card-grid { grid-template-columns: repeat(2, 1fr); gap: 20px; } }
@media (min-width: 1024px) { .card-grid { grid-template-columns: repeat(3, 1fr); } }

/* 弹窗样式修复区 */
.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
  background-color: rgba(0, 0, 0, 0.6); backdrop-filter: blur(3px);
  display: flex; justify-content: center; align-items: center; z-index: 2000; 
}
.modal-content {
  background: #ffffff; width: 90%; max-width: 360px; padding: 24px; border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2); display: flex; flex-direction: column; gap: 12px;
  animation: modal-pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
@keyframes modal-pop { 0% { transform: scale(0.8); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }

.modal-content h3 { margin: 0 0 10px 0; color: #333; text-align: center; font-size: 20px; font-weight: 900; }
.modal-input, .modal-textarea {
  width: 100%; padding: 12px 14px; border: 1px solid #ddd; border-radius: 10px;
  font-size: 14px; background-color: #f9f9f9; box-sizing: border-box; outline: none; font-family: inherit; transition: border-color 0.2s;
}
.modal-input:focus, .modal-textarea:focus { border-color: #FFD700; background-color: #fff; }
.modal-textarea { resize: vertical; min-height: 80px; }
.modal-actions { display: flex; justify-content: space-between; gap: 12px; margin-top: 10px; }
.cancel-btn, .submit-btn { flex: 1; border: none; padding: 12px; border-radius: 10px; cursor: pointer; font-size: 15px; font-weight: bold; }
.cancel-btn { background-color: #f1f2f5; color: #666; }
.submit-btn { background-color: #FFD700; color: #333; }
.cancel-btn:active, .submit-btn:active { transform: scale(0.96); }
</style>