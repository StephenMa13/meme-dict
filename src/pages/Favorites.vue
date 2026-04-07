<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { getMemes } from '../db.js' 
import { favoriteIds, toggleFavorite } from '../store.js' 

const router = useRouter()

const goToDetail = (id) => {
  router.push(`/meme/${id}`)
}

// 🌟 修复版核心逻辑
const favoriteMemes = computed(() => {
  // 1. 获取所有梗数据
  const allMemesFromDB = getMemes() 
  
  // 2. 先找出所有在收藏夹里的梗（使用你之前生效的过滤逻辑，兼容性最好）
  const filtered = allMemesFromDB.filter(meme => {
    // 兼容数字和字符串的 ID 比较
    return favoriteIds.value.some(id => String(id) === String(meme.id))
  })

  // 3. 按照收藏的时间顺序进行排序（后收藏的排在前面）
  // 逻辑：在 favoriteIds 数组中，索引（Index）越大的代表越晚收藏
  return filtered.sort((a, b) => {
    const indexA = favoriteIds.value.findIndex(id => String(id) === String(a.id))
    const indexB = favoriteIds.value.findIndex(id => String(id) === String(b.id))
    return indexB - indexA // 降序排列：索引大的在前
  })
})
</script>


<template>
  <div class="favorites-page">
    <h2 class="page-title">⭐ 我的收藏夹</h2>
    
    <div v-if="favoriteMemes.length === 0" class="empty-state">
      <div class="empty-icon">📭</div>
      <p>这里空空如也，快去首页收藏几个梗吧！</p>
    </div>

    <div class="card-grid" v-else>
      <div class="card" v-for="(meme, index) in favoriteMemes" :key="meme.id" @click="goToDetail(meme.id)">
        <div class="card-left">
          <div class="meme-info">
            <h3 class="meme-term">{{ meme.term }}</h3>
          </div>
        </div>
        
        <div class="card-right">
          <button class="action-btn fav-btn" @click.stop="toggleFavorite(meme.id)">
            ⭐
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 1. 💡 核心修改：移除强制灰色，改为透明，让底层背景透出来 */
.favorites-page { 
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
  background-color: transparent !important; /* 透明化，透出粉色/绿色/黑色 */
  min-height: 100vh;
  padding: 20px;
  padding-bottom: 80px; 
  box-sizing: border-box;
  padding-top: calc(16px + env(safe-area-inset-top)); /* 手机安全距离 + 一点呼吸空间 */
}

/* 标题样式：适配夜间模式变量 */
.page-title {
  margin-top: 0;
  margin-bottom: 20px;
  color: var(--text-main); /* 改用变量 */
  font-size: 18px;
  font-weight: 600;
  -webkit-tap-highlight-color: transparent;
}

/* 空状态样式 */
.empty-state {
  text-align: center;
  color: var(--text-secondary); /* 改用变量 */
  margin-top: 80px;
}
.empty-icon {
  font-size: 50px;
  margin-bottom: 10px;
}

/* ====================================================
   🔥 2. 复刻首页的强制横向排版与白底卡片
   ==================================================== */
.card-grid { 
  display: grid; 
  grid-template-columns: 1fr; 
  gap: 16px; 
}

.card { 
  display: flex !important;           
  flex-direction: row !important;     
  justify-content: space-between !important; 
  align-items: center !important;     
  background: var(--card-bg) !important; 
  border: 1px solid var(--border-color); 
  border-radius: 10px; 
  padding: 8px 12px; 
  box-shadow: 0 4px 8px rgba(0,0,0,0.04); 
  cursor: pointer; 
  color: var(--text-main);
  max-width: 92%;  
  transition:transform 0.1s, box-shadow 0.1s;
  box-shadow: 0 2px 6px rgba(0,0,0,0.03);
  -webkit-tap-highlight-color: transparent;
}

.card:active {
  transform: scale(0.98);
  -webkit-tap-highlight-color: transparent;
}

/* 强制左侧（标题）横向排版 */
.card-left { 
  display: flex !important; 
  flex-direction: row !important; 
  align-items: center !important; 
  flex: 1; 
  overflow: hidden; 
}

/* 强制右侧（收藏按钮）横向排版 */
.card-right { 
  display: flex !important; 
  flex-direction: row !important; 
  align-items: center !important; 
  gap: 8px !important; 
  margin-left: 10px; 
}

/* 标题防换行样式 */
.meme-info { flex: 1; display: flex; align-items: center; }
.meme-term { 
  font-size: 14px !important; font-weight: 700px !important; margin: 0 !important; 
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; 
  color: var(--text-main); /* 💡 改用变量 */
}

/* 收藏按钮样式 */
.action-btn { 
  border: none; padding: 6px 10px; border-radius: 8px; font-size: 11px; 
  font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 4px; 
}

/* 收藏夹里的按钮颜色适配 */
.fav-btn { 
  background-color: rgba(255, 71, 87, 0.1); /* 淡淡的红底 */
  color: #ff4757; 
} 

@media (min-width: 768px) { 
  .card-grid { grid-template-columns: repeat(2, 1fr); gap: 20px; } 
}
@media (min-width: 1024px) { 
  .card-grid { grid-template-columns: repeat(3, 1fr); } 
}
</style>