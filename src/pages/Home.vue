<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getMemes, addMeme as localAdd, deleteMeme as localDelete } from '../db.js' // ⭐️ 引入本地引擎
import { favoriteIds, toggleFavorite } from '../store.js'

const router = useRouter()
const hotMemes = ref([])
const searchQuery = ref('')
const showModal = ref(false)

const newForm = ref({ term: '', pinyin: '', summary: '',category: '默认' })

// ⭐️ 改用本地方法加载数据
const loadData = () => {
  hotMemes.value = getMemes()
}

onMounted(() => loadData())

const filteredMemes = computed(() => {
  if (searchQuery.value === '') return hotMemes.value
  const keyword = searchQuery.value.toLowerCase()
  return hotMemes.value.filter(meme => meme.term.includes(keyword) || meme.pinyin.includes(keyword))
})

// ⭐️ 改用本地方法提交
const submitMeme = () => {
  if (!newForm.value.term || !newForm.value.summary) return alert('不能为空哦！')
  localAdd({ ...newForm.value }) // 保存到本地硬盘
  showModal.value = false
  newForm.value = { term: '', pinyin: '', summary: '' }
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
      <h2 class="section-title">{{ searchQuery ? `🔍 搜索结果` : '🔥 今日热搜' }}</h2>
      
      <div class="card-grid">
        <div class="card" v-for="(meme, index) in filteredMemes" :key="meme.id" @click="goToDetail(meme.id)">
          <div class="card-left">
            <span class="rank" :class="'rank-' + (index + 1)" v-if="!searchQuery">{{ index + 1 }}</span>
            <div class="meme-info">
              <h3 class="meme-term">{{ meme.term }}</h3>
            </div>
          </div>
          
          <div class="card-right">
            <button class="action-btn fav-btn" @click.stop="toggleFavorite(meme.id)">
              {{ favoriteIds.includes(meme.id) ? '⭐' : '☆' }}
            </button>
            <button class="action-btn like-btn" @click.stop="likeMeme(meme.id)">👍 {{ meme.view_count }}</button>
            <button class="action-btn delete-btn" @click.stop="deleteMeme(meme.id)">🗑️</button>
          </div>
        </div>
      </div>
    </main>

    <div v-if="showModal" class="modal-overlay">
      <div class="modal-content">
        <h3>贡献新梗</h3>
        <input v-model="newForm.term" placeholder="名字" class="modal-input" />
        <input v-model="newForm.pinyin" placeholder="拼音缩写" class="modal-input" />
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
/* 1. 强制加深整个页面的灰色背景，这样白卡片绝对能看出来！ */
.app-container { 
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
  background-color: #f0f2f5 !important; /* 加深了灰色 */
  min-height: 100vh;
  padding-bottom: 80px;
}

.navbar { max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; padding: 12px 20px; }
.logo { font-size: 20px; font-weight: 900; color: #333; }
.add-btn { background-color: #FFD700; border: none; padding: 6px 14px; border-radius: 20px; font-weight: bold; cursor: pointer; color: #333; }

/* 2. 压缩后的头部 Hero 区域 */
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
.section-title { font-size: 18px; font-weight: bold; margin-bottom: 16px; color: #333; }

/* ====================================================
   🔥 3. 核心修复区：强制卡片和内容“横向排排坐” 
   ==================================================== */
.card-grid { 
  display: grid; 
  grid-template-columns: 1fr; 
  gap: 16px; 
}

.card { 
  display: flex !important;           /* 魔法1：强制横向弹性盒 */
  flex-direction: row !important;     /* 魔法2：强制从左到右排 */
  justify-content: space-between !important; /* 魔法3：左右两端对齐 */
  align-items: center !important;     /* 魔法4：上下垂直居中 */
  background: #ffffff !important;     /* 强制纯白背景 */
  border: 1px solid #e4e6eb;          /* 兜底策略：加一圈极细的灰边，绝对能看出白框 */
  border-radius: 12px; 
  padding: 16px 20px; 
  box-shadow: 0 4px 8px rgba(0,0,0,0.04); 
  cursor: pointer; 
}

/* 强制左侧（序号 + 标题）横向排版 */
.card-left { 
  display: flex !important; 
  flex-direction: row !important; 
  align-items: center !important; 
  flex: 1; 
  overflow: hidden; 
}

/* 强制右侧（所有按钮）横向排版 */
.card-right { 
  display: flex !important; 
  flex-direction: row !important; 
  align-items: center !important; 
  gap: 10px !important; 
  margin-left: 10px; 
}

/* ==================================================== */

/* 序号样式 */
.rank { 
  font-size: 18px; font-weight: 900; color: #bbb; width: 24px; 
  margin-right: 12px; flex-shrink: 0; text-align: center;
}
.rank-1 { color: #FF4500; font-size: 22px; }
.rank-2 { color: #FF8C00; font-size: 20px; }
.rank-3 { color: #FFA500; font-size: 18px; }

/* 标题样式（去除 H3 的默认换行属性） */
.meme-info { flex: 1; display: flex; align-items: center; }
.meme-term { 
  font-size: 16px; font-weight: bold; margin: 0 !important; /* 强制干掉 H3 的默认外边距 */
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #333;
}

/* 按钮统一风格 */
.action-btn { 
  border: none; padding: 6px 12px; border-radius: 12px; font-size: 12px; 
  font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 4px; 
}
.fav-btn { background-color: #f0f4f8; color: #4a90e2; } /* 蓝色系收藏框 */
.like-btn { background-color: #fff8e1; color: #ff8f00; } /* 橙色系点赞 */
.delete-btn { background-color: #ffebee; color: #e53935; } /* 红色系删除 */

@media (min-width: 768px) { 
  .card-grid { grid-template-columns: repeat(2, 1fr); gap: 20px; } 
}
@media (min-width: 1024px) { 
  .card-grid { grid-template-columns: repeat(3, 1fr); } 
}
</style>