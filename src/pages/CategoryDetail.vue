<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getMemes } from '../db.js'

const route = useRoute()
const router = useRouter()

// 从网址里获取当前点击的分类名
const categoryName = route.params.name 
const allMemes = ref([])

onMounted(() => {
  allMemes.value = getMemes()
})

// 💡 核心逻辑：过滤出当前分类的梗，并按浏览量降序排列
const categoryMemes = computed(() => {
  return allMemes.value
    .filter(meme => {
      let cats = meme.category || '未分类'
      if (!Array.isArray(cats)) cats = [cats]
      return cats.includes(categoryName)
    })
    .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
})

// 点击词条卡片，跳往词条详情页 (假设你的详情页路由是 /detail/:id)
const goToMemeDetail = (id) => {
  router.push(`/meme/${id}`) 
}
</script>

<template>
  <div class="category-detail-container">
    <header class="page-header">
      <button class="back-btn" @click="router.back()">⬅️ 返回</button>
      <div class="header-text">
        <h2>🏷️ {{ categoryName }}</h2>
        <p class="subtitle">该分类下的所有热梗，按热度降序排列</p>
      </div>
    </header>

    <div class="card-grid">
      <div 
        class="card" 
        v-for="(meme, index) in categoryMemes" 
        :key="meme.id" 
        @click="goToMemeDetail(meme.id)"
      >
        <div class="card-left">
          <div class="meme-info">
            <h3 class="meme-term">{{ meme.term }}</h3>
          </div>
        </div>
        
        <div class="card-right">
          <span class="hot-badge">🔥 {{ meme.view_count || 0 }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 容器与头部排版 */
.category-detail-container { padding: 20px; max-width: 1200px; margin: 0 auto; padding-bottom: 80px; }
.page-header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }

/* 返回按钮 */
.back-btn { 
  background: var(--card-bg); 
  border: 1px solid var(--border-color); 
  color: var(--text-main); 
  padding: 8px 16px; 
  border-radius: 20px; 
  font-weight: bold; 
  cursor: pointer; 
  transition: all 0.2s; 
  flex-shrink: 0; 
}
.back-btn:hover { background: var(--bg-color); border-color: #ff4757; }

/* 标题区防御 */
.header-text { flex: 1; min-width: 0; }
.header-text h2 { margin: 0; color: var(--text-main); font-size: 22px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.subtitle { color: var(--text-secondary); font-size: 13px; margin-top: 4px; margin-bottom: 0; }

/* 卡片网格 */
.card-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }

/* 基础卡片样式 */
.card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: var(--card-bg);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
  cursor: pointer;
  /* 🌟 核心：默认左边框颜色（第四名及以后的浅红色） */
  border-left: 6px solid #FFCDD2; 
}

/* 🌟 前四名颜色梯度（深红 -> 浅红） */
.card:nth-child(1) { border-left-color: #B71C1C; }
.card:nth-child(2) { border-left-color: #D32F2F; }
.card:nth-child(3) { border-left-color: #F44336; }
.card:nth-child(4) { border-left-color: #EF9A9A; }

.card:hover {
  transform: translateX(5px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  background-color: var(--bg-color);
}

/* 卡片内部布局 */
.card-left { display: flex; align-items: center; flex: 1; min-width: 0; }
.meme-info { flex: 1; min-width: 0; }

.meme-term {
  margin: 0;
  font-size: 17px;
  color: var(--text-main);
  font-weight: 600;
  /* 💡 开启省略号通道 */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-right { flex-shrink: 0; margin-left: 12px; }

/* 热度徽章样式优化 */
.hot-badge { 
  font-size: 13px; 
  font-weight: bold; 
  color: #ff4757; 
  background: rgba(255, 71, 87, 0.1); 
  padding: 4px 12px; 
  border-radius: 20px; 
}

/* 响应式网格 */
@media (min-width: 768px) { 
  .card-grid { grid-template-columns: repeat(2, 1fr); gap: 16px; } 
}
@media (min-width: 1024px) { 
  .card-grid { grid-template-columns: repeat(3, 1fr); } 
}
</style>