<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getMemeById } from '../db.js'
import { favoriteIds, toggleFavorite, markNotInterested, likedIds, toggleLike } from '../store.js'

const route = useRoute()
const router = useRouter()
const meme = ref(null)

const goBack = () => {
  router.back() 
}

const handleNotInterested = (id) => {
  markNotInterested(id)
  router.back() // 既然用户没兴趣，点完直接送他回上一页（回到首页后，这个梗也会因为全局状态更新而自动隐藏）
}

const categoryConfig = {
  '萌系': { icon: '🐱', color: '#FFE4E1' },
  '科技': { icon: '🤖', color: '#E0F7FA' },
  '二次元': { icon: '🌸', color: '#F3E5F5' },
  '方言': { icon: '🐒', color: '#FFF9C4' },
  '职场': { icon: '💻', color: '#E8F5E9' },       // 适合：牛马、摸鱼、打工人、画大饼
  '情感': { icon: '❤️‍🔥', color: '#FCE4EC' },     // 适合：恋爱脑、纯爱战神、舔狗
  '游戏': { icon: '🎮', color: '#E8EAF6' },       // 适合：破防、菜就多练、猪队友
  '抽象': { icon: '🤡', color: '#F3E5F5' },       // 适合：泰裤辣、鸡你太美、依托答辩
  '社交': { icon: '💬', color: '#E3F2FD' },       // 适合：e人/i人、社交牛逼症、搭子
  '生活': { icon: '🛋️', color: '#F5F5F5' },       // 适合：躺平、摆烂、消费降级、特种兵旅游
  '饭圈': { icon: '🌟', color: '#FFF3E0' },       // 适合：塌房、打call、绝绝子
  '校园': { icon: '🎓', color: '#FFFDE7' },       // 适合：卷王、脆皮大学生、早八
  '谐音梗': { icon: '📢', color: '#FBE9E7' },      // 适合：尊嘟假嘟、耗子尾汁、蓝瘦香菇
  '默认': { icon: '💡', color: '#F0F0F0' } 
}

onMounted(() => {
  const localMeme = getMemeById(route.params.id)
  if (localMeme) {
    // 1. 兼容处理：如果 category 是数组就直接用，如果是以前的单字符串就包成数组，如果啥也没写就给个'默认'
    let categories = []
    if (Array.isArray(localMeme.category)) {
      categories = localMeme.category
    } else if (localMeme.category) {
      categories = [localMeme.category]
    } else {
      categories = ['默认']
    }

    // 2. 把每个分类名字，映射成带颜色和图标的对象
    const processedTags = categories.map(cat => {
      const config = categoryConfig[cat] || categoryConfig['默认']
      return { name: cat, icon: config.icon, color: config.color }
    })

    // 3. 取第一个标签作为头像的主题色（如果一个标签都没有，就用默认）
    const primaryConfig = processedTags[0] || categoryConfig['默认']

    meme.value = {
      ...localMeme,
      tagsInfo: processedTags, // 🌟 新增：存入处理好的多标签数组
      icon: primaryConfig.icon, // 主头像图标
      bgColor: primaryConfig.color, // 主头像背景色
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
        <span v-for="tag in meme.tagsInfo" 
              :key="tag.name" 
              class="tag-badge" 
              :style="{ backgroundColor: tag.color }">
          {{ tag.icon }} {{ tag.name }}
        </span>
      </div>
      
      <div class="content">
        <h3>📖 一句话秒懂</h3>
        <p>{{ meme.summary }}</p>
        <h3>🕵️‍♂️ 深度科普</h3>
        <p v-html="meme.content"></p>
      </div>

      <div class="detail-actions" v-if="meme">
        <button class="action-btn fav-btn" :class="{ 'active': favoriteIds.includes(meme.id) }" @click="toggleFavorite(meme.id)">
          {{ favoriteIds.includes(meme.id) ? '⭐ 已收藏' : '☆ 收藏' }}
        </button>
        <button class="action-btn like-btn" :class="{ 'liked-active': likedIds.includes(meme.id) }" @click="toggleLike(meme.id)">
          👍 点赞
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
.tags { 
  margin-bottom: 30px; 
  display: flex; 
  justify-content: center; 
  flex-wrap: wrap; /* 标签太多会自动换行 */
  gap: 10px; /* 🌟 让多个标签之间保持 10px 的距离 */
}
.tag-badge { padding: 6px 12px; border-radius: 20px; font-size: 14px; font-weight: bold; color: #333; }

.content { text-align: left; margin-top: 30px; border-top: 1px solid #eee; padding-top: 30px; }
.content h3 { color: #000; font-size: 20px; border-left: 4px solid #FFD700; padding-left: 10px; }
.content p { line-height: 1.8; color: #444; font-size: 16px; }

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

/* 💡 补全：点赞激活后的样式，让按钮按下去有视觉反馈 */
.liked-active { 
  background-color: #ffe0b2 !important; 
  color: #e65100 !important; 
}
</style>