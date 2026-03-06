<template>
  <div class="app-container">
    <!-- 🌟 修改后的头部：移除了返回按钮，标题下移且放大 -->
    <header class="category-hero">
      <div class="header-content">
        <h1 class="category-display-title"># {{ categoryName }}</h1>
        <div class="category-stats">
          共 {{ categoryMemes.length }} 个词条
        </div>
      </div>
    </header>

    <main class="hot-list">      
      <!-- 列表为空的状态 -->
      <div v-if="categoryMemes.length === 0" class="empty-state">
        该分类下暂时没有词条哦 😊
      </div>

      <!-- 🌟 这里的结构完全复刻首页的 .card-grid 和 .card -->
      <div v-else class="card-grid">
        <div 
          class="card" 
          v-for="meme in categoryMemes" 
          :key="meme.id" 
          @click="goToDetail(meme.id)"
        >
          <div class="card-top">
            <div class="meme-info">
              <!-- 使用与首页相同的截断逻辑 -->
              <h3 class="meme-term">{{ truncate(meme.term) }}</h3>
            </div>
            <div class="card-actions">
              <!-- 收藏按钮 -->
              <button 
                class="action-btn fav-btn small-btn" 
                @click.stop="toggleFavorite(meme.id)"
              >
                {{ favoriteIds.includes(meme.id) ? '⭐' : '☆' }}
              </button>
              <!-- 点赞按钮 -->
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

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getMemes } from '../db.js'
// 导入与首页相同的状态和方法
import { favoriteIds, toggleFavorite, likedIds, toggleLike, blacklistIds } from '../store.js'

const route = useRoute()
const router = useRouter()

// 从路由参数获取名字
const categoryName = route.params.name 
const allMemes = ref([])

// 页面加载时从数据库获取数据
onMounted(() => {
  allMemes.value = getMemes()
})

// 💡 核心排序逻辑：按用户交互状态进行多级权重排序
const categoryMemes = computed(() => {
  return allMemes.value
    .filter(meme => {
      // 1. 基本过滤：只保留属于当前分类的
      let cats = meme.category || '未分类'
      if (!Array.isArray(cats)) cats = [cats]
      return cats.includes(categoryName)
    })
    .sort((a, b) => {
      // 2. 定义计算权重的内部函数
      const getPriority = (meme) => {
        const isFav = favoriteIds.value.includes(meme.id)
        const isLiked = likedIds.value.includes(meme.id)
        const isBlack = blacklistIds.value.includes(meme.id)

        if (isBlack) return 0;          // 最末：点了没意思的（黑名单）
        if (isFav && isLiked) return 4; // 优先：收藏 + 点赞
        if (isFav) return 3;            // 其次：只收藏
        if (isLiked) return 2;          // 再次：只点赞
        return 1;                       // 普通：都没点
      }

      const priorityA = getPriority(a)
      const priorityB = getPriority(b)

      // 3. 排序逻辑
      if (priorityA !== priorityB) {
        // 如果权重不同，按权重从大到小排
        return priorityB - priorityA 
      } else {
        // 如果权重相同（比如都是“收藏+点赞”），则按原来的热度(view_count)排
        return (b.view_count || 0) - (a.view_count || 0)
      }
    })
})


const goToDetail = (id) => {
  router.push(`/meme/${id}`)
}

// 保持与首页一致的截断函数
const truncate = (text) => {
  if (!text) return ''
  return text.length > 10 ? text.slice(0, 10) + '…' : text
}
</script>

<style scoped>
/* 1. 基础布局容器 */
.app-container { 
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
  min-height: 100vh; 
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
.hot-list { max-width: 1000px; margin: 0 auto; padding: 5px 20px; }

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
