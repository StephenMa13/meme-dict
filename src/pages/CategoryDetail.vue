<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getMemes } from '../db.js'
import { favoriteIds, toggleFavorite, likedIds, toggleLike, blacklistIds } from '../store.js'

const route = useRoute()
const router = useRouter()

const categoryName = route.params.name 
// 🌟 修改：使用 ref 代替 computed，用于锁定初始加载时的顺序
const displayedMemes = ref([])

// 💡 排序逻辑封装：将原本 computed 里的逻辑提取出来
const getSortedMemes = () => {
  const all = getMemes()
  
  // 1. 过滤分类
  const filtered = all.filter(meme => {
    let cats = meme.category || '未分类'
    if (!Array.isArray(cats)) cats = [cats]
    return cats.includes(categoryName)
  })

  // 2. 权重排序
  return filtered.sort((a, b) => {
    const getPriority = (meme) => {
      const isFav = favoriteIds.value.includes(meme.id)
      const isLiked = likedIds.value.includes(meme.id)
      const isBlack = blacklistIds.value.includes(meme.id)
      if (isBlack) return 0
      if (isFav && isLiked) return 4
      if (isFav) return 3
      if (isLiked) return 2
      return 1
    }

    const priorityA = getPriority(a)
    const priorityB = getPriority(b)

    if (priorityA !== priorityB) {
      return priorityB - priorityA 
    } else {
      return (b.view_count || 0) - (a.view_count || 0)
    }
  })
}

// 🌟 核心修改：仅在进入页面时计算一次顺序
onMounted(() => {
  displayedMemes.value = getSortedMemes()
})

const goToDetail = (id) => {
  router.push(`/meme/${id}`)
}

const truncate = (text) => {
  if (!text) return ''
  return text.length > 10 ? text.slice(0, 10) + '…' : text
}
</script>


<template>
  <div class="app-container">
    <header class="category-hero">
      <div class="header-content">
        <h1 class="category-display-title"># {{ categoryName }}</h1>
        <div class="category-stats">
          共 {{ displayedMemes.length }} 个词条
        </div>
      </div>
    </header>

    <!-- 🌟 修改点：给 main 增加滚动容器控制 -->
    <main class="hot-list">      
      <div v-if="displayedMemes.length === 0" class="empty-state">
        该分类下暂时没有词条哦 😊
      </div>

      <!-- 🌟 使用 displayedMemes 循环 -->
      <div v-else class="card-grid">
        <div 
          class="card" 
          v-for="meme in displayedMemes" 
          :key="meme.id" 
          @click="goToDetail(meme.id)"
        >
          <div class="card-top">
            <div class="meme-info">
              <h3 class="meme-term">{{ truncate(meme.term) }}</h3>
            </div>
            <div class="card-actions">
              <!-- 图标依然保持响应式更新，但 card 本身位置已固定 -->
              <button 
                class="action-btn fav-btn small-btn" 
                @click.stop="toggleFavorite(meme.id)"
              >
                {{ favoriteIds.includes(meme.id) ? '⭐' : '☆' }}
              </button>
              <button 
                class="action-btn like-btn small-btn" 
                @click.stop="toggleLike(meme.id)"
              >
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
/* 1. 基础布局容器 */
.app-container { 
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
  height: 100dvh; 
  background-color: var(--bg-color); 
  color: var(--text-main);
}

/* 2. 大标题头部区域 */
.category-hero {
  padding: 20px 25px 15px; 
  background: linear-gradient(180deg, var(--card-bg) 0%, var(--bg-color) 100%);
  text-align: left;
  max-width: 1000px;
  margin: 0 auto;
  width: 100%;
  flex-shrink: calc();
}

.category-display-title {
  font-size: 2.2rem; 
  font-weight: 800;
  margin: 5px 0;
  color: var(--text-main);
  letter-spacing: -1px;
}

.category-stats {
  font-size: 12px;
  color: #888;
  margin-top: 2px;
}

/* 3. 核心列表样式 - 100% 同步首页 */
.hot-list { 
  max-width: 1000px; 
  width: 100%;
  margin: 0 auto; 
  padding: 5px 20px 40px; 
  box-sizing: border-box; 
  flex: 1;
  overflow-y: auto; 
  overscroll-behavior-y: contain;}

/* 网格布局同步 */
.card-grid { 
  display: grid; 
  grid-template-columns: 1fr; 
  gap: 10px; 
}

/* 卡片样式同步 */
.card { 
  background: var(--card-bg) !important; 
  border: 1px solid var(--border-color); 
  border-radius: 8px; /* 圆角变小 */
  padding: 8px 10px; /* 内边距变紧凑 */
  box-shadow: 0 2px 4px rgba(0,0,0,0.03); 
  cursor: pointer; 
  color: var(--text-main);
  transition: all 0.2s ease;
}
.card:active { transform: scale(0.98); }

.card-top { 
  display: flex; 
  align-items: center; 
  gap: 10px; 
  justify-content: space-between; 
}

.meme-info { 
  flex: 1; 
  display: flex; 
  align-items: center; 
  min-width: 0; /* 必须加这个才能让省略号生效 */
}

/* 词条文字样式同步 */
.meme-term { 
  font-size: 14px; /* 字体变小 */
  font-weight: 700; 
  margin: 0 !important; 
  white-space: nowrap; 
  overflow: hidden; 
  text-overflow: ellipsis; 
  color: var(--text-main); 
}

.card-actions { display: flex; gap: 8px; flex-shrink: 0; }

/* 按钮样式同步 */
.small-btn { 
  width: 70px; /* 按钮宽度同步 */
  padding: 6px 8px; 
  font-size: 12px; 
}

.action-btn { 
  border: none; 
  border-radius: 8px; 
  font-size: 11px; 
  font-weight: bold; 
  cursor: pointer; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  gap: 4px; 
  width: auto; 
  flex-shrink: 0; 
  transition: all 0.2s; 
}

.fav-btn { background-color: rgba(74, 144, 226, 0.1); color: #4a90e2; }
.like-btn { background-color: rgba(255, 143, 0, 0.1); color: #ff8f00; }
.fav-btn.active { background-color: #4a90e2; color: white; }

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
  background: var(--card-bg);
  border-radius: 20px;
  margin-top: 20px;
}

/* 响应式断点同步 */
@media (min-width: 768px) { 
  .card-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; } 
  .category-display-title { font-size: 3rem; }
}
@media (min-width: 1024px) { 
  .card-grid { grid-template-columns: repeat(3, 1fr); } 
}
</style>
