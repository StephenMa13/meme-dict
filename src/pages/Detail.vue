<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getMemeById } from '../db.js'
// 1. 导入外部分类配置
import { categoryConfig } from '../categories.js' 
import { favoriteIds, toggleFavorite, blacklistIds, toggleNotInterested, likedIds, toggleLike } from '../store.js'

const route = useRoute()
const router = useRouter()
const meme = ref(null)

const goBack = () => { router.back() }
const goToCategory = (categoryName) => { router.push(`/category/${categoryName}`) }

const handleNotInterested = (id) => {
  if (likedIds.value.includes(id) || favoriteIds.value.includes(id)) return;
  toggleNotInterested(id); 
};

onMounted(() => {
  const localMeme = getMemeById(route.params.id)
  if (localMeme) {
    let categories = Array.isArray(localMeme.category) ? localMeme.category : (localMeme.category ? [localMeme.category] : ['默认'])
    const processedTags = categories.map(cat => {
      const config = categoryConfig[cat] || categoryConfig['默认']
      return { name: cat, icon: config.icon, color: config.color }
    })
    const primaryConfig = processedTags[0] || categoryConfig['默认']
    
    meme.value = {
      ...localMeme,
      tagsInfo: processedTags,
      icon: primaryConfig.icon,
      bgColor: primaryConfig.color,
      // 优先读取新字段 details，兼容旧字段 content
      details: localMeme.details || localMeme.content || `还没有关于“${localMeme.term}”的详细科普哦...`
    }
  }
})
</script>

<template>
  <div class="detail-container" v-if="meme">
    <div class="card">
      
      <!-- 🌟 固定区域：头像、标题、标签 -->
      <div class="card-fixed-header">
        <button class="back-btn-inner" @click="goBack">
          <span class="icon">🔙</span>
        </button>
      
        <div class="avatar" :style="{ backgroundColor: meme.bgColor }">
          {{ meme.icon }}
        </div>
        
        <h1 class="title">{{ meme.term }}</h1>
        <div class="tags">
          <span v-for="tag in meme.tagsInfo" 
                :key="tag.name" 
                class="tag-badge clickable-tag" 
                :style="{ backgroundColor: tag.color }"
                @click="goToCategory(tag.name)">
            {{ tag.icon }} {{ tag.name }}
          </span>
        </div>
        
        <div class="divider"></div>
      </div>

      <!-- 🌟 仅此处可滑动：深度科普内容 -->
      <div class="card-scroll-body">
        <div class="content">
          <h3>📖 一句话秒懂</h3>
          <p class="summary-text">{{ meme.summary }}</p>
          
          <h3>🕵️‍♂️ 深度科普</h3>
          <p class="details-text" v-html="meme.details"></p>
        </div>

        <!-- 交互按钮放在滑动区域底部 -->
        <div class="detail-actions">
          <button class="action-btn fav-btn" :class="{ 'active': favoriteIds.includes(meme.id), 'is-disabled': blacklistIds.includes(meme.id) }" :disabled="blacklistIds.includes(meme.id)" @click="toggleFavorite(meme.id)">
            <span class="icon-box">{{ favoriteIds.includes(meme.id) ? '⭐' : '☆' }}</span>
          </button>

          <button class="action-btn like-btn" :class="{ 'is-disabled': blacklistIds.includes(meme.id) }" :disabled="blacklistIds.includes(meme.id)" @click="toggleLike(meme.id)">
            <span class="icon-box">❤️</span>
          </button>

          <button class="action-btn not-interested-btn" :class="{ 'is-hidden': blacklistIds.includes(meme.id), 'is-disabled': likedIds.includes(meme.id) || favoriteIds.includes(meme.id) }" :disabled="likedIds.includes(meme.id) || favoriteIds.includes(meme.id)" @click="handleNotInterested(meme.id)">
            <span class="icon-wrapper">🙈</span>
          </button>
        </div>
        <div style="height: 20px;"></div>
      </div>
      
    </div>
  </div>
</template>

<style scoped>
/* 彻底锁定外部，禁止整页滚动 */
.detail-container { 
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  padding: 20px;
  background-color: var(--bg-color);
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden; 
}

.card { 
  background: var(--card-bg); 
  border-radius: 24px; 
  box-shadow: 0 10px 30px rgba(0,0,0,0.1); 
  border: 1px solid var(--border-color);
  width: 100%;
  max-width: 500px;
  height: 85vh; /* 卡片固定高度 */
  display: flex;
  flex-direction: column; /* 垂直排版 */
  overflow: hidden; 
}

/* 固定头部样式 */
.card-fixed-header {
  flex-shrink: 0; /* 绝对不收缩 */
  padding: 40px 25px 0 25px;
  text-align: center;
  position: relative;
}

/* 滚动主体样式 */
.card-scroll-body {
  flex: 1; /* 占据剩下的所有空间 */
  overflow-y: auto; /* 允许纵向滚动 */
  padding: 0 25px;
  /* 优化滚动流畅度 */
  -webkit-overflow-scrolling: touch; 
}

/* 滚动条美化 (可选) */
.card-scroll-body::-webkit-scrollbar { width: 4px; }
.card-scroll-body::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 10px; }

.divider {
  height: 1px;
  background: var(--border-color);
  margin: 20px 0 0 0;
  opacity: 0.5;
}

.back-btn-inner {
  position: absolute; top: 15px; left: 15px;
  background: transparent; border: none; font-size: 20px; cursor: pointer;
}

.title { font-size: 32px; margin: 10px 0; font-weight: 800; }

.avatar { 
  width: 80px; height: 80px; border-radius: 50%; 
  margin: 0 auto 10px; display: flex; justify-content: center; align-items: center; 
  font-size: 40px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); 
}

.tag-badge { 
  padding: 4px 12px; border-radius: 20px; font-size: 12px; 
  font-weight: 600; display: inline-flex; align-items: center; gap: 4px;
  border: 1px solid rgba(0,0,0,0.05);
}

.content { padding-top: 20px; }
.content h3 { font-size: 18px; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
.summary-text { background: var(--bg-color); padding: 12px; border-radius: 12px; font-style: italic; }
.details-text { line-height: 1.8; font-size: 16px; white-space: pre-wrap; }

.detail-actions {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px dashed var(--border-color);
}

.action-btn {
  width: 48px; height: 48px;
  background: transparent; border: none;
  cursor: pointer; transition: transform 0.2s;
}
.action-btn:active { transform: scale(0.9); }
.icon-box { font-size: 24px; }
.fav-btn.active { color: #FFD700; }
.is-disabled { opacity: 0.3; filter: grayscale(1); pointer-events: none; }
</style>
