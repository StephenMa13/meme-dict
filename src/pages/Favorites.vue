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

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { favoriteIds, toggleFavorite } from '../store.js' // 引入全局记忆

// ⚠️ 注意：这里需要引入你所有的梗数据！
import allMemes from '../data/memes.json' 

const router = useRouter()

// 跳转详情页的函数
const goToDetail = (id) => {
  router.push(`/meme/${id}`) // ⚠️ 注意：如果你的详情页路由不是 /meme/:id，请换成你真实的路径（比如 /detail/${id}）
}

// 魔法核心：计算属性。从所有梗里，揪出那些 ID 在收藏列表里的梗
const favoriteMemes = computed(() => {
  return allMemes.filter(meme => favoriteIds.value.includes(meme.id))
})
</script>

<style scoped>
/* 1. 💡 核心修改：移除强制灰色，改为透明，让底层背景透出来 */
.favorites-page { 
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
  background-color: transparent !important; /* 透明化，透出粉色/绿色/黑色 */
  min-height: 100vh;
  padding: 20px;
  padding-bottom: 80px; 
  box-sizing: border-box;
}

/* 标题样式：适配夜间模式变量 */
.page-title {
  margin-top: 0;
  margin-bottom: 20px;
  color: var(--text-main); /* 改用变量 */
  font-size: 22px;
  font-weight: 800;
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
  background: var(--card-bg) !important; /* 💡 改用变量，夜间会变深灰 */
  border: 1px solid var(--border-color); /* 💡 改用变量 */
  border-radius: 12px; 
  padding: 16px 20px; 
  box-shadow: 0 4px 8px rgba(0,0,0,0.04); 
  cursor: pointer; 
  color: var(--text-main); /* 💡 确保文字颜色正确 */
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
  gap: 10px !important; 
  margin-left: 10px; 
}

/* 标题防换行样式 */
.meme-info { flex: 1; display: flex; align-items: center; }
.meme-term { 
  font-size: 16px; font-weight: bold; margin: 0 !important; 
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; 
  color: var(--text-main); /* 💡 改用变量 */
}

/* 收藏按钮样式 */
.action-btn { 
  border: none; padding: 6px 12px; border-radius: 12px; font-size: 12px; 
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