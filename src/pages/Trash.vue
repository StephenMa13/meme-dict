<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { getMemes } from '../db.js' // 引入本地数据
import { notInterestedIds, removeNotInterested } from '../store.js' // 引入黑名单和恢复方法

const router = useRouter()
const allMemes = getMemes()

// 过滤出所有被标记为“不感兴趣”的词条
const hiddenMemes = computed(() => {
  return allMemes.filter(meme => notInterestedIds.value.includes(meme.id))
})

const goToDetail = (id) => {
  router.push(`/meme/${id}`)
}
</script>

<template>
  <div class="trash-page">
    <h1 class="page-title">🗑️ 回收站</h1>
    
    <div v-if="hiddenMemes.length === 0" class="empty-state">
      <div class="empty-icon">✨</div>
      <p>回收站空空如也~</p>
    </div>

    <div v-else class="card-grid">
      <div class="card" v-for="meme in hiddenMemes" :key="meme.id" @click="goToDetail(meme.id)">
        <div class="card-left">
          <div class="meme-info">
            <h3 class="meme-term">{{ meme.term }}</h3>
          </div>
        </div>
        
        <div class="card-right">
          <button class="action-btn restore-btn" @click.stop="removeNotInterested(meme.id)">
            ↩️ 恢复
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 完全复刻收藏夹的样式 */
.trash-page { 
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
  background-color: #f0f2f5 !important; 
  min-height: 100vh;
  padding: 20px;
  padding-bottom: 80px; 
  box-sizing: border-box;
}

.page-title { margin-top: 0; margin-bottom: 20px; color: #333; font-size: 22px; font-weight: 800; }
.empty-state { text-align: center; color: #888; margin-top: 80px; }
.empty-icon { font-size: 50px; margin-bottom: 10px; }

/* 核心：卡片和横向排版 */
.card-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
.card { 
  display: flex !important; flex-direction: row !important; justify-content: space-between !important; 
  align-items: center !important; background: #ffffff !important; border: 1px solid #e4e6eb; 
  border-radius: 12px; padding: 16px 20px; box-shadow: 0 4px 8px rgba(0,0,0,0.04); cursor: pointer; 
}

.card-left { display: flex !important; flex-direction: row !important; align-items: center !important; flex: 1; overflow: hidden; }
.card-right { display: flex !important; flex-direction: row !important; align-items: center !important; gap: 10px !important; margin-left: 10px; }

.meme-info { flex: 1; display: flex; align-items: center; }
.meme-term { font-size: 16px; font-weight: bold; margin: 0 !important; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #333; }

/* 按钮样式对齐 */
.action-btn { 
  border: none; padding: 6px 0; border-radius: 12px; font-size: 12px; 
  font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px; 
  width: 85px; flex-shrink: 0; transition: all 0.2s;
}

/* 恢复按钮采用清新的青绿色调 */
.restore-btn { background-color: #e0f7fa; color: #00838f; } 

@media (min-width: 768px) { .card-grid { grid-template-columns: repeat(2, 1fr); gap: 20px; } }
@media (min-width: 1024px) { .card-grid { grid-template-columns: repeat(3, 1fr); } }
</style>