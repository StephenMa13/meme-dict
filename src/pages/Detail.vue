<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getMemeById } from '../db.js'
import { favoriteIds, toggleFavorite } from '../store.js'

const route = useRoute()
const router = useRouter()
const meme = ref(null)
const goBack = () => {
  router.back() 
}
const likeMeme = () => {
  if (meme.value) {
    meme.value.view_count++ // 假设 view_count 是点赞数
    // 如果你有 db.js 里的更新方法，可以在这里调用
  }
}

// ⭐️ 魔法配置：根据不同标签，赋予不同的 Emoji 和背景色
const categoryConfig = {
  '萌系': { icon: '🐱', color: '#FFE4E1' }, // 浅粉色
  '科技': { icon: '🤖', color: '#E0F7FA' }, // 浅蓝色
  '二次元': { icon: '🌸', color: '#F3E5F5' }, // 浅紫色
  '方言': { icon: '🐒', color: '#FFF9C4' }, // 浅黄色
  '默认': { icon: '💡', color: '#F0F0F0' }  // 灰色
}

onMounted(() => {
  const localMeme = getMemeById(route.params.id)
  if (localMeme) {
    const config = categoryConfig[localMeme.category] || categoryConfig['默认']
    meme.value = {
      ...localMeme,
      icon: config.icon,
      bgColor: config.color,
      content: `这里是关于“${localMeme.term}”的详细解析...`
    }
  }
})
</script>

<template>
  <div class="detail-container" v-if="meme">
    <button class="back-btn" @click="router.back('/')">🔙 返回</button>
    
    <div class="card">
      <div class="avatar" :style="{ backgroundColor: meme.bgColor }">
        {{ meme.icon }}
      </div>
      
      <h1 class="title">{{ meme.term }}</h1>
      <div class="tags">
        <span class="tag-badge" :style="{ backgroundColor: meme.bgColor }">
          {{ meme.category || '未分类' }}
        </span>
      </div>
      
      <div class="content">
        <h3>📖 一句话秒懂</h3>
        <p>{{ meme.summary }}</p>
        <h3>🕵️‍♂️ 深度科普</h3>
        <p>{{ meme.content }}</p>
      </div>

      <div class="detail-actions" v-if="meme">
        <button class="action-btn fav-btn" @click="toggleFavorite(meme.id)">
          {{ favoriteIds.includes(meme.id) ? '⭐ 已收藏' : '☆ 收藏' }}
        </button>
        <button class="action-btn like-btn" @click="likeMeme">
          👍 {{ meme.view_count || '点赞' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 保持原有样式，新增头像和标签样式 */
.detail-container { max-width: 800px; margin: 40px auto; padding: 0 20px; font-family: sans-serif; }
.back-btn { background: #fff; border: 1px solid #ddd; padding: 8px 16px; border-radius: 20px; cursor: pointer; margin-bottom: 20px; font-weight: bold; }
.card { background: #fff; padding: 40px 30px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); text-align: center; }
.title { font-size: 36px; margin: 0 0 15px 0; font-weight: 900; }

/* ⭐️ 新增头像样式 */
.avatar { 
  width: 100px; height: 100px; border-radius: 50%; 
  margin: 0 auto 20px; display: flex; justify-content: center; align-items: center; 
  font-size: 50px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); 
}
.tags { margin-bottom: 30px; }
.tag-badge { padding: 6px 12px; border-radius: 20px; font-size: 14px; font-weight: bold; color: #333; }

.content { text-align: left; margin-top: 30px; border-top: 1px solid #eee; padding-top: 30px; }
.content h3 { color: #000; font-size: 20px; border-left: 4px solid #FFD700; padding-left: 10px; }
.content p { line-height: 1.8; color: #444; font-size: 16px; }
.detail-actions {
  display: flex;
  gap: 15px;
  margin-top: 20px;
}
.action-btn { 
  border: none; padding: 8px 16px; border-radius: 12px; font-size: 14px; 
  font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 6px; 
}
.fav-btn { background-color: #f0f4f8; color: #4a90e2; }
.like-btn { background-color: #fff8e1; color: #ff8f00; }
</style>