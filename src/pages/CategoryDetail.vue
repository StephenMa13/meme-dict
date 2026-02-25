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
          <div class="rank" :class="{ 'rank-1': index === 0, 'rank-2': index === 1, 'rank-3': index === 2 }">
            {{ index + 1 }}
          </div>
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
.back-btn { background: var(--card-bg); border: 1px solid var(--border-color); color: var(--text-main); padding: 8px 16px; border-radius: 20px; font-weight: bold; cursor: pointer; transition: all 0.2s; }
.back-btn:hover { background: var(--bg-color); }
.header-text h2 { margin: 0; color: var(--text-main); font-size: 22px; }
.subtitle { color: var(--text-secondary); font-size: 13px; margin-top: 4px; margin-bottom: 0; }

/* 💡 直接原样搬运首页的精美卡片样式，已包含夜间模式变量 */
.card-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
.card { display: flex; flex-direction: row; justify-content: space-between; align-items: center; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 12px; padding: 16px 20px; box-shadow: 0 4px 8px rgba(0,0,0,0.04); cursor: pointer; color: var(--text-main); transition: transform 0.2s, box-shadow 0.2s; }
.card:hover { transform: translateY(-2px); box-shadow: 0 8px 16px rgba(0,0,0,0.1); }
.card-left { display: flex; flex-direction: row; align-items: center; flex: 1; overflow: hidden; }
.card-right { display: flex; flex-direction: row; align-items: center; margin-left: 10px; }

/* 排名数字样式 */
.rank { font-size: 18px; font-weight: 900; color: #bbb; width: 24px; margin-right: 12px; flex-shrink: 0; text-align: center; }
.rank-1 { color: #FF4500; font-size: 22px; }
.rank-2 { color: #FF8C00; font-size: 20px; }
.rank-3 { color: #FFA500; font-size: 18px; }

.meme-info { flex: 1; display: flex; align-items: center; }
.meme-term { font-size: 16px; font-weight: bold; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-main); }
.hot-badge { font-size: 13px; font-weight: bold; color: #ff4757; background: rgba(255, 71, 87, 0.1); padding: 4px 10px; border-radius: 12px; }

@media (min-width: 768px) { .card-grid { grid-template-columns: repeat(2, 1fr); gap: 20px; } }
@media (min-width: 1024px) { .card-grid { grid-template-columns: repeat(3, 1fr); } }
</style>