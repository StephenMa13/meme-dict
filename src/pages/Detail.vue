<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getMemeById } from '../db.js'
// 💡 统一引入：添加不感兴趣的功能
import { favoriteIds, toggleFavorite, markNotInterested } from '../store.js'

const route = useRoute()
const router = useRouter()
const meme = ref(null)

// 💡 修正：router.back 不需要参数
const goBack = () => {
  router.back() 
}

// 💡 统一：点赞逻辑
const likeMeme = () => {
  if (meme.value) {
    meme.value.view_count = (meme.value.view_count || 0) + 1
  }
}

// 💡 统一：减少推荐后自动返回
const handleNotInterested = (id) => {
  markNotInterested(id)
  router.back() // 既然用户没兴趣，点完直接送他回上一页
}

const categoryConfig = {
  '萌系': { icon: '🐱', color: '#FFE4E1' },
  '科技': { icon: '🤖', color: '#E0F7FA' },
  '二次元': { icon: '🌸', color: '#F3E5F5' },
  '方言': { icon: '🐒', color: '#FFF9C4' },
  '默认': { icon: '💡', color: '#F0F0F0' } 
}

onMounted(() => {
  const localMeme = getMemeById(route.params.id)
  if (localMeme) {
    const config = categoryConfig[localMeme.category] || categoryConfig['默认']
    meme.value = {
      ...localMeme,
      icon: config.icon,
      bgColor: config.color,
      // 保持之前的 summary，如果 content 为空则给个默认文字
      content: localMeme.content || `这里是关于“${localMeme.term}”的详细解析...`
    }
  }
})
</script>

<template>
  <div class="detail-container" v-if="meme">
    <button class="back-btn" @click="goBack">🔙 返回</button>
    
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
        <button class="action-btn fav-btn" :class="{ 'active': favoriteIds.includes(meme.id) }" @click="toggleFavorite(meme.id)">
          {{ favoriteIds.includes(meme.id) ? '⭐ 已收藏' : '☆ 收藏' }}
        </button>
        <button class="action-btn like-btn" @click="likeMeme">
          👍 点赞 {{ meme.view_count || 0 }}
        </button>
        <button class="action-btn not-interested-btn" @click="handleNotInterested(meme.id)">
          🙈 减少推荐
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
/* ... 保留之前的 avatar, tags 等样式 ... */
.detail-actions {
  display: flex;
  justify-content: center; /* 详情页按钮居中排布 */
  gap: 12px;
  margin: 30px 0;
}
.action-btn {
  border: none;
  padding: 8px 0;      /* 上下 8px，左右靠 width */
  border-radius: 12px;
  font-size: 13px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 90px;         /* 💡 详情页空间大，统一给 90px 更大气 */
  transition: all 0.2s;
}
.not-interested-btn {
  width: 105px !important; 
  background-color: #f1f2f5;
  color: #666;
}
.action-btn:active { transform: scale(0.95); }
.fav-btn { background-color: #f0f4f8; color: #4a90e2; }
.fav-btn.active { background-color: #fff0f0; color: #ff4757; }
.like-btn { background-color: #fff8e1; color: #ff8f00; }
</style>