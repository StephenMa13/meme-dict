<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getMemeById } from '../db.js'
// 1. 导入外部配置
import { categoryConfig } from '../categories.js' 
import { favoriteIds, toggleFavorite, blacklistIds, toggleNotInterested, likedIds, toggleLike } from '../store.js'

const route = useRoute()
const router = useRouter()
const meme = ref(null)

const goBack = () => { router.back() }
const goToCategory = (categoryName) => { router.push(`/category/${categoryName}`) }

/** 
 * 🌟 核心逻辑修改：互斥处理
 */

// 处理喜欢点击：如果当前是不喜欢，则先取消不喜欢，再执行喜欢
const handleLikeClick = (id) => {
  if (blacklistIds.value.includes(id)) {
    toggleNotInterested(id); // 移除不喜欢
  }
  toggleLike(id);
};

const handleFavoriteClick = (id) => {
  toggleFavorite(id);
};

// 处理不喜欢点击：如果当前是喜欢，则先取消喜欢，再执行不喜欢
const handleNotInterestedClick = (id) => {
  if (likedIds.value.includes(id)) {
    toggleLike(id); // 移除喜欢
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
      // 兼容旧字段 content 和新字段 details
      details: localMeme.details || localMeme.content || `还没有关于“${localMeme.term}”的详细科普哦...`
    }
  }
})
</script>

<template>
  <div class="detail-container" v-if="meme">
    <div class="card">
      
      <!-- 🌟 固定区域：头像、标题、标签 (不可滑动) -->
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

      <!-- 🌟 仅此处可滑动：内容与操作按钮 -->
      <div class="card-scroll-body">
        <div class="content">
          <h3>📖 一句话秒懂</h3>
          <p class="summary-text">{{ meme.summary }}</p>
          
          <h3>🕵️‍♂️ 深度科普</h3>
          <p class="details-text" v-html="meme.details"></p>
        </div>

        <!-- 🌟 按钮组：始终有效，状态互斥 -->
        <div class="detail-actions">
          <!-- 收藏：独立 -->
          <button class="action-btn" 
                  :class="{ 'active-fav': favoriteIds.includes(meme.id) }" 
                  @click="handleFavoriteClick(meme.id)">
            <span class="icon-box">{{ favoriteIds.includes(meme.id) ? '⭐' : '☆' }}</span>
          </button>

          <!-- 喜欢：与不喜欢互斥 -->
          <button class="action-btn" 
                  :class="{ 'active-like': likedIds.includes(meme.id) }" 
                  @click="handleLikeClick(meme.id)">
            <span class="icon-box">{{ likedIds.includes(meme.id) ? '❤️' : '🤍' }}</span>
          </button>

          <!-- 不喜欢：与喜欢互斥 -->
          <button class="action-btn" 
                  :class="{ 'active-dislike': blacklistIds.includes(meme.id) }" 
                  @click="handleNotInterestedClick(meme.id)">
            <span class="icon-box">{{ blacklistIds.includes(meme.id) ? '🙈' : '👁️' }}</span>
          </button>
        </div>
        <div style="height: 30px;"></div>
      </div>
      
    </div>
  </div>
</template>

<style scoped>
/* 锁定视口 */
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

/* 固定头部 */
.card-fixed-header {
  flex-shrink: 0; padding: 40px 25px 0 25px;
  text-align: center; position: relative;
}

/* 仅中间内容滚动 */
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

/* 🌟 操作按钮样式优化 */
.detail-actions {
  display: flex; justify-content: center; gap: 40px;
  margin-top: 40px; padding: 20px 0;
  border-top: 1px dashed var(--border-color);
}

.action-btn {
  width: 50px; height: 50px; border-radius: 50%;
  background: var(--bg-color); border: 1px solid var(--border-color);
  cursor: pointer; transition: all 0.2s;
  display: flex; align-items: center; justify-content: center;
}

.action-btn:active { transform: scale(0.9); }

/* 激活状态的颜色 */
.active-fav { background: #fffdf0; border-color: #FFD700; color: #FFD700; box-shadow: 0 2px 8px rgba(255,215,0,0.2); }
.active-like { background: #fff5f5; border-color: #ff4757; color: #ff4757; box-shadow: 0 2px 8px rgba(255,71,87,0.2); }
.active-dislike { background: #f1f2f6; border-color: #2f3542; color: #2f3542; opacity: 1; }

.icon-box { font-size: 24px; }
</style>
