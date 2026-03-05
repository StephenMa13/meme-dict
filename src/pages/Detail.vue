<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getMemeById } from '../db.js'
import { categoryConfig } from '../categories.js' 
import { favoriteIds, toggleFavorite, blacklistIds, toggleNotInterested, likedIds, toggleLike } from '../store.js'

const route = useRoute()
const router = useRouter()
const meme = ref(null)

const goBack = () => { router.back() }
const goToCategory = (categoryName) => { router.push(`/category/${categoryName}`) }

// 处理喜欢点击
const handleLikeClick = (id) => {
  if (blacklistIds.value.includes(id)) {
    toggleNotInterested(id); 
  }
  toggleLike(id);
};

const handleFavoriteClick = (id) => {
  toggleFavorite(id);
};

// 处理不喜欢点击
const handleNotInterestedClick = (id) => {
  if (likedIds.value.includes(id)) {
    toggleLike(id); 
  }
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
      details: localMeme.details || localMeme.content || `还没有关于“${localMeme.term}”的详细科普哦...`
    }
  }
})
</script>

<template>
  <div class="detail-container" v-if="meme">
    <div class="card">
      
      <!-- 固定区域 -->
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

      <!-- 滑动区域 -->
      <div class="card-scroll-body">
        <div class="content">
          <h3>📖 一句话秒懂</h3>
          <p class="summary-text">{{ meme.summary }}</p>
          
          <h3>🕵️‍♂️ 深度科普</h3>
          <p class="details-text" v-html="meme.details"></p>
        </div>

        <!-- 操作按钮：纯图标、固定宽度、不位移 -->
        <div class="detail-actions">
          <!-- 收藏 -->
          <button class="action-btn-minimal" 
                  @click="handleFavoriteClick(meme.id)">
            <span class="icon-box" :class="{ 'active-icon': favoriteIds.includes(meme.id) }">
              {{ favoriteIds.includes(meme.id) ? '⭐' : '☆' }}
            </span>
          </button>

          <!-- 喜欢 -->
          <button class="action-btn-minimal" 
                  @click="handleLikeClick(meme.id)">
            <span class="icon-box" :class="{ 'active-icon': likedIds.includes(meme.id) }">
              {{ likedIds.includes(meme.id) ? '❤️' : '🤍' }}
            </span>
          </button>

          <!-- 不喜欢：图标保持为 👎，通过 CSS 改变激活状态 -->
          <button class="action-btn-minimal" 
                  @click="handleNotInterestedClick(meme.id)">
            <span class="icon-box dislike-icon" 
                  :class="{ 'active-dislike': blacklistIds.includes(meme.id) }">
              👎
            </span>
          </button>
        </div>
        <div style="height: 30px;"></div>
      </div>
      
    </div>
  </div>
</template>

<style scoped>
.detail-container { 
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  padding: 20px; background-color: var(--bg-color);
  display: flex; justify-content: center; align-items: center;
  overflow: hidden; 
}

.card { 
  background: var(--card-bg); border-radius: 24px; 
  box-shadow: 0 10px 30px rgba(0,0,0,0.1); border: 1px solid var(--border-color);
  width: 100%; max-width: 500px;
  height: 85vh; display: flex; flex-direction: column; overflow: hidden; 
}

.card-fixed-header {
  flex-shrink: 0; padding: 40px 25px 0 25px;
  text-align: center; position: relative;
}

.card-scroll-body {
  flex: 1; overflow-y: auto; padding: 0 25px;
  -webkit-overflow-scrolling: touch; 
}

.divider { height: 1px; background: var(--border-color); margin: 20px 0 0 0; opacity: 0.5; }
.back-btn-inner { position: absolute; top: 15px; left: 15px; background: transparent; border: none; font-size: 20px; cursor: pointer; }
.title { font-size: 32px; margin: 10px 0; font-weight: 800; color: var(--text-main); }
.avatar { width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 10px; display: flex; justify-content: center; align-items: center; font-size: 40px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
.tag-badge { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; border: 1px solid rgba(0,0,0,0.05); }

.content { padding-top: 20px; text-align: left; }
.content h3 { font-size: 18px; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; color: var(--text-main); }
.summary-text { background: var(--bg-color); padding: 15px; border-radius: 12px; font-style: italic; color: var(--text-main); line-height: 1.6; }
.details-text { line-height: 1.8; font-size: 16px; white-space: pre-wrap; color: var(--text-main); opacity: 0.9; }

/* 🌟 操作按钮：强制固定宽度，防止偏移 */
.detail-actions {
  display: flex; justify-content: center; gap: 50px;
  margin-top: 40px; padding: 20px 0;
  border-top: 1px dashed var(--border-color);
}

.action-btn-minimal {
  background: transparent; border: none; cursor: pointer;
  padding: 0; outline: none;
  -webkit-tap-highlight-color: transparent;
  
  /* 关键：固定容器宽度，确保按钮中心点不动 */
  width: 44px; 
  height: 44px;
  flex-shrink: 0; /* 禁止伸缩 */
  display: flex; align-items: center; justify-content: center;
  transition: transform 0.2s;
}

.action-btn-minimal:active {
  transform: scale(1.3);
}

/* 🌟 图标样式 */
.icon-box {
  font-size: 20px; /* 图标缩小 */
  line-height: 1;
  opacity: 0.4; /* 默认未激活状态为浅色（模拟空心感） */
  transition: all 0.2s;
}

/* 激活状态 */
.active-icon {
  opacity: 1; /* 激活后变为实色 */
  filter: drop-shadow(0 0 5px rgba(255, 215, 0, 0.3)); /* 增加一点光晕感 */
}

/* 不喜欢图标专属 */
.dislike-icon {
  opacity: 0.3; /* 初始更浅一些 */
}
.active-dislike {
  opacity: 1 !important;
  filter: grayscale(0); /* 如果有需要可以加点颜色 */
}
</style>
