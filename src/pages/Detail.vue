<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getMemeById } from '../db.js'
import { favoriteIds, toggleFavorite,blacklistIds, toggleNotInterested, likedIds, toggleLike } from '../store.js'

const route = useRoute()
const router = useRouter()
const meme = ref(null)

const goBack = () => {
  router.back() 
}

// 在 <script setup> 中定义一个响应式变量，标记是否已拉黑


const handleNotInterested = (id) => {
  if (likedIds.value.includes(id) || favoriteIds.value.includes(id)) return;
  toggleNotInterested(id); 
};
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
  '默认': { icon: '💡', color: '#F0F0F0' },
  '亚文化': { icon: '🎭', color: '#E1BEE7' },      // 适合：谷子、吧唧、三坑
  '消费': { icon: '🛍️', color: '#FFCCBC' },        // 适合：种草/拔草、智商税、盲盒
  '时尚': { icon: '✨', color: '#F8BBD0' },        // 适合：多巴胺穿搭、纯欲风
  '吐槽': { icon: '🗣️', color: '#CFD8DC' },        // 适合：键盘侠、爹味、夺笋 
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
          {{ favoriteIds.includes(meme.id) ? '⭐ ' : '☆ ' }}
        </button>
        <button class="action-btn like-btn" :class="{ 'liked-active': likedIds.includes(meme.id) }" @click="toggleLike(meme.id)">
          {{ likedIds.includes(meme.id) ? '❤️ ' : '🤍 ' }}
        </button>
        <button 
          v-if="!likedIds.includes(meme.id) && !favoriteIds.includes(meme.id)"
          class="action-btn not-interested-btn" 
          :class="{ 'is-hidden': blacklistIds.includes(meme.id) }"
          @click="handleNotInterested(meme.id)"
        >
          {{ blacklistIds.includes(meme.id) ? '🙈 ' : '🙈 ' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 1. 基础容器：去除硬编码背景，改用变量 */
.detail-container { max-width: 800px; margin: 40px auto; padding: 0 20px; font-family: sans-serif; color: var(--text-main); }

/* 返回按钮：适配黑夜模式 */
.back-btn { 
  background: var(--card-bg); 
  border: 1px solid var(--border-color); 
  padding: 8px 16px; 
  border-radius: 20px; 
  cursor: pointer; 
  margin-bottom: 20px; 
  font-weight: bold; 
  color: var(--text-main);
}

/* 核心卡片：背景跟随变量 */
.card { 
  background: var(--card-bg); 
  padding: 40px 30px; 
  border-radius: 12px; 
  box-shadow: 0 4px 20px rgba(0,0,0,0.08); 
  text-align: center; 
  border: 1px solid var(--border-color);
}

.title { font-size: 36px; margin: 0 0 15px 0; font-weight: 900; color: var(--text-main); }

/* 2. 头像与标签 */
.avatar { 
  width: 100px; height: 100px; border-radius: 50%; 
  margin: 0 auto 20px; display: flex; justify-content: center; align-items: center; 
  font-size: 50px; background: var(--bg-color); /* 头像底色也跟随主题 */
  box-shadow: 0 4px 10px rgba(0,0,0,0.1); 
}

.tags { margin-bottom: 30px; display: flex; justify-content: center; flex-wrap: wrap; gap: 10px; }

/* 标签：给个半透明背景，这样在粉色/绿色背景下都能看清 */
.tag-badge { 
  padding: 6px 12px; border-radius: 20px; font-size: 14px; 
  font-weight: bold; color: var(--text-main); 
  background: rgba(128, 128, 128, 0.1); 
  border: 1px solid var(--border-color);
}

/* 3. 内容区：适配文字颜色 */
.content { text-align: left; margin-top: 30px; border-top: 1px solid var(--border-color); padding-top: 30px; }
.content h3 { color: var(--text-main); font-size: 20px; border-left: 4px solid #FFD700; padding-left: 10px; }
.content p { line-height: 1.8; color: var(--text-main); opacity: 0.9; font-size: 16px; }

/* 4. 按钮组布局 */
.detail-actions {
  display: flex;
  justify-content: center; 
  gap: 12px;
  margin: 30px 0;
  flex-wrap: wrap; /* 手机端宽度不够会自动换行 */
}

.action-btn {
  border: none;
  padding: 10px 0; 
  border-radius: 12px;
  font-size: 13px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 100px; /* 稍微加宽一点点，容纳“已收藏”等字样 */
  transition: all 0.2s;
}

.action-btn:active { transform: scale(0.95); }

/* 5. 各按钮配色（使用 RGBA 确保在黑夜模式下也有质感） */
.fav-btn { background-color: rgba(74, 144, 226, 0.1); color: #4a90e2; }

.like-btn { background-color: rgba(255, 143, 0, 0.1); color: #ff8f00; }

/* 没意思按钮的初始样式 */
.not-interested-btn {
  background-color: rgba(128, 128, 128, 0.1);
  color: #888;
  transition: all 0.2s;
}

/* 💡 点击后变成“撤销隐藏”的样式 */
.not-interested-btn.is-hidden {
  background-color: #333 !important; /* 变成深色，警示意味更浓 */
  color: #fff !important;
  border: 1px solid #555;
}

/* 悬浮时的反馈 */
.not-interested-btn:hover {
  filter: brightness(0.9);
}
</style>