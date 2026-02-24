<script setup>
import { ref, onMounted, computed } from 'vue' // 把所有的写在一起
import { useRouter } from 'vue-router'
import { getMemes, addMeme as localAdd, deleteMeme as localDelete } from '../db.js'
import { favoriteIds, toggleFavorite, notInterestedIds, markNotInterested } from '../store.js'

const router = useRouter()
const hotMemes = ref([])
const searchQuery = ref('')
const showModal = ref(false)

const newForm = ref({ term: '', summary: '',category: '默认' })

// ⭐️ 改用本地方法加载数据
const loadData = () => {
  hotMemes.value = getMemes()
}

onMounted(() => loadData())

const filteredMemes = computed(() => {
  // 1. 先拿到“没被屏蔽”的所有词条
  let list = hotMemes.value.filter(meme => !notInterestedIds.value.includes(meme.id));

  // 2. 如果没有搜索关键词，直接返回剩下的这些
  if (searchQuery.value === '') {
    return list;
  }

  // 3. 如果有关键词，在“没被屏蔽”的列表里进行搜索
  const keyword = searchQuery.value.toLowerCase();
  return list.filter(meme => 
    meme.term.includes(keyword) || 
    (meme.pinyin && meme.pinyin.includes(keyword))
  );
});

// ⭐️ 改用本地方法提交
const submitMeme = () => {
  if (!newForm.value.term || !newForm.value.summary) return alert('不能为空哦！')
  localAdd({ ...newForm.value }) // 保存到本地硬盘
  showModal.value = false
  newForm.value = { term: '', summary: '',category: '默认' }
  loadData() // 刷新列表
}
// 在 Home.vue 的脚本里添加这个缺失的函数
const likeMeme = (id) => {
  const meme = hotMemes.value.find(m => m.id === id)
  if (meme) {
    // 增加计数，如果是存 db.js 的，记得在 db.js 也要写更新逻辑
    meme.view_count = (meme.view_count || 0) + 1
  }
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
            <button class="action-btn fav-btn":class="{ 'active': favoriteIds.includes(meme.id) }" @click.stop="toggleFavorite(meme.id)">
              {{ favoriteIds.includes(meme.id) ? '⭐ 已收藏' : '☆ 收藏' }}
            </button>
            <button class="action-btn like-btn" @click.stop="likeMeme(meme.id)">👍点赞 {{ meme.view_count }}</button>
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
  border: none;
  padding: 6px 0;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 85px;      /* 💡 统一固定宽度 */
  flex-shrink: 0;
  transition: all 0.2s;
}

.not-interested-btn {
  width: 95px !important; /* 💡 减少推荐文字多，稍微宽一点 */
  background-color: #f1f2f5;
  color: #666;
}
.fav-btn { background-color: #f0f4f8; color: #4a90e2; } /* 蓝色系收藏框 */
.like-btn { background-color: #fff8e1; color: #ff8f00; } /* 橙色系点赞 */

@media (min-width: 768px) { 
  .card-grid { grid-template-columns: repeat(2, 1fr); gap: 20px; } 
}
@media (min-width: 1024px) { 
  .card-grid { grid-template-columns: repeat(3, 1fr); } 
}

/* ====================================================
   🎁 4. 弹窗样式修复区：让“贡献新梗”弹窗居中且美观
   ==================================================== */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw; /* 撑满全宽 */
  height: 100vh; /* 撑满全高 */
  background-color: rgba(0, 0, 0, 0.6); /* 半透明黑底遮罩 */
  backdrop-filter: blur(3px); /* 增加一点毛玻璃效果，更显高级 */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000; /* 💡 必须大于底部导航栏的 z-index(1000) */
}

.modal-content {
  background: #ffffff;
  width: 90%;
  max-width: 360px; /* 控制最大宽度，手机端看起来更精致 */
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
  gap: 12px;
  animation: modal-pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); /* 弹出动画 */
}

/* 弹窗小动画：让它出现时有“弹一下”的 Q 弹感 */
@keyframes modal-pop {
  0% { transform: scale(0.8); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.modal-content h3 {
  margin: 0 0 10px 0;
  color: #333;
  text-align: center;
  font-size: 20px;
  font-weight: 900;
}

/* 输入框统一风格 */
.modal-input, .modal-textarea {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #ddd;
  border-radius: 10px;
  font-size: 14px;
  background-color: #f9f9f9;
  box-sizing: border-box; /* 💡 防止 padding 撑破父容器 */
  outline: none;
  font-family: inherit;
  transition: border-color 0.2s;
}

.modal-input:focus, .modal-textarea:focus {
  border-color: #FFD700; /* 聚焦时边框变色，和你的黄色主题呼应 */
  background-color: #fff;
}

.modal-textarea {
  resize: vertical; /* 允许垂直拉伸 */
  min-height: 80px;
}

/* 按钮区域排列 */
.modal-actions {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 10px;
}

.cancel-btn, .submit-btn {
  flex: 1; /* 两个按钮平分宽度 */
  border: none;
  padding: 12px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 15px;
  font-weight: bold;
}

.cancel-btn {
  background-color: #f1f2f5;
  color: #666;
}

.submit-btn {
  background-color: #FFD700;
  color: #333;
}

.cancel-btn:active, .submit-btn:active {
  transform: scale(0.96); /* 点击时的按压反馈 */
}
</style>