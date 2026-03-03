<script setup>
/* 逻辑部分保持不变 */
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getMemeById } from '../db.js'
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

const categoryConfig = {
  '萌系': { icon: '🐱', color: '#FFE4E1' },
  '科技': { icon: '🤖', color: '#E0F7FA' },
  '二次元': { icon: '🌸', color: '#F3E5F5' },
  '方言': { icon: '🐒', color: '#FFF9C4' },
  '职场': { icon: '💻', color: '#E8F5E9' },
  '情感': { icon: '❤️‍🔥', color: '#FCE4EC' },
  '游戏': { icon: '🎮', color: '#E8EAF6' },
  '抽象': { icon: '🤡', color: '#F3E5F5' },
  '社交': { icon: '💬', color: '#E3F2FD' },
  '生活': { icon: '🛋️', color: '#F5F5F5' },
  '饭圈': { icon: '🌟', color: '#FFF3E0' },
  '校园': { icon: '🎓', color: '#FFFDE7' },
  '谐音梗': { icon: '📢', color: '#FBE9E7' },
  '默认': { icon: '💡', color: '#F0F0F0' },
  '亚文化': { icon: '🎭', color: '#E1BEE7' },
  '消费': { icon: '🛍️', color: '#FFCCBC' },
  '时尚': { icon: '✨', color: '#F8BBD0' },
  '吐槽': { icon: '🗣️', color: '#CFD8DC' }, 
}

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
      content: localMeme.content || `这里是关于“${localMeme.term}”的详细解析...`
    }
  }
})
</script>

<template>
  <div class="detail-container" v-if="meme">
    <div class="card">
      <!-- 🌟 第一部分：固定区域 (Header) -->
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
        
        <!-- 🌟 分割线：时刻可见 -->
        <div class="divider"></div>
      </div>

      <!-- 🌟 第二部分：独立滚动区域 (Body) -->
      <div class="card-scroll-body">
        <div class="content">
          <h3>📖 一句话秒懂</h3>
          <p>{{ meme.summary }}</p>
          <h3>🕵️‍♂️ 深度科普</h3>
          <p v-html="meme.content"></p>
        </div>

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
        <!-- 底部留白 -->
        <div style="height: 40px;"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* --- 布局核心逻辑修改 --- */

.detail-container { 
  max-width: 800px; 
  margin: 0 auto; /* 去掉 40px top/bottom，由内部撑开 */
  padding: 0 20px; 
  font-family: sans-serif; 
  color: var(--text-main);
  height: 100vh; /* 强制容器等于屏幕高度 */
  display: flex;
  align-items: center; /* 居中卡片 */
  overflow: hidden; /* 彻底禁止外部滚动 */
}

.card { 
  position: relative; 
  background: var(--card-bg); 
  border-radius: 12px; 
  box-shadow: 0 4px 20px rgba(0,0,0,0.08); 
  border: 1px solid var(--border-color);
  width: 100%;
  height: 90vh; /* 卡片高度为屏幕的 90% */
  display: flex;
  flex-direction: column; /* 纵向排列 Header 和 Body */
  overflow: hidden; /* 溢出隐藏，由内部 Body 处理滚动 */
}

/* 固定头部 */
.card-fixed-header {
  flex-shrink: 0; /* 头部不收缩 */
  padding: 40px 30px 0 30px;
  background: var(--card-bg);
  z-index: 2;
}

/* 独立滚动的主体 */
.card-scroll-body {
  flex: 1; /* 占据剩余所有空间 */
  overflow-y: auto; /* 只有这里产生滚动条 */
  padding: 0 30px 40px 30px;
  -webkit-overflow-scrolling: touch;
}

/* 显眼的分割线 */
.divider {
  height: 1px;
  background: var(--border-color);
  margin: 20px -30px 0 -30px; /* 负边距让线顶到卡片边缘 */
  opacity: 0.6;
}

/* --- 以下样式完全保留你的原始代码 --- */

.back-btn-inner {
  position: absolute; top: 15px; left: 15px;
  background: transparent; border: none; display: flex; align-items: center; gap: 4px;
  cursor: pointer; color: var(--text-secondary); font-size: 20px; font-weight: bold;
  padding: 8px; transition: all 0.2s;
}
.back-btn-inner:active { transform: scale(0.9); opacity: 0.7; }

.title { font-size: 36px; margin: 0 0 15px 0; font-weight: 900; color: var(--text-main); text-align: center; }

.avatar { 
  width: 100px; height: 100px; border-radius: 50%; 
  margin: 0 auto 20px; display: flex; justify-content: center; align-items: center; 
  font-size: 50px; background: var(--bg-color);
  box-shadow: 0 4px 10px rgba(0,0,0,0.1); 
}

.tags { margin-bottom: 20px; display: flex; justify-content: center; flex-wrap: wrap; gap: 10px; }

.tag-badge { 
  padding: 4px 10px; border-radius: 18px; font-size: 10px; 
  font-weight: bold; color: var(--text-main); 
  background: rgba(128, 128, 128, 0.1); 
  border: 1px solid var(--border-color);
  display: inline-flex; align-items: center; gap: 4px;
}
.clickable-tag { cursor: pointer; transition: transform 0.2s; user-select: none; }
.clickable-tag:hover { transform: scale(1.05); filter: brightness(0.9); }

.content { text-align: left; padding-top: 20px; }
.content h3 { color: var(--text-main); font-size: 20px; border-left: 4px solid #FFD700; padding-left: 10px; }
.content p { line-height: 1.8; color: var(--text-main); opacity: 0.9; font-size: 16px; }

/* 🌟 核心修改：按钮组样式 */
.detail-actions {
  display: flex;
  justify-content: center; /* 居中 */
  align-items: center;     /* 同一高度 */
  gap: 25px;               /* 相同间距 */
  margin: 30px 0;
  padding-top: 20px;
  border-top: 1px dashed var(--border-color);
}

.action-btn {
  /* 整体缩小：从 60px 降至 48px */
  width: 48px; 
  height: 48px;
  
  display: inline-flex;
  align-items: center;
  justify-content: center;
  
  background: transparent !important;
  border: none !important;
  cursor: pointer;
  transition: transform 0.1s, opacity 0.2s;
  padding: 0;
}
.action-btn:active { transform: scale(0.92); }
.icon-wrapper, .icon-box { font-size: 22px; width: 32px; height: 32px; line-height: 32px; text-align: center; display: inline-block; }
.fav-btn { color: #4a90e2; }
.fav-btn.active { color: #FFD700; }
.not-interested-btn { color: #888; }
.is-disabled { opacity: 0.3; cursor: not-allowed; filter: grayscale(1); pointer-events: none; }
.is-hidden { display: none; }
</style>
