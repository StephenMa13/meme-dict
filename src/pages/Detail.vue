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
    <div class="card">
      <button class="back-btn-inner" @click="goBack">
        <span class="icon">🔙</span>
        <span class="text">返回</span>
      </button>
    
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
        <button 
          class="action-btn fav-btn" 
          :class="{ 'active': favoriteIds.includes(meme.id), 'is-disabled': blacklistIds.includes(meme.id) }" 
          :disabled="blacklistIds.includes(meme.id)"
          @click="toggleFavorite(meme.id)"
        >
          <span class="icon-box">
            {{ favoriteIds.includes(meme.id) ? '⭐' : '☆' }}
          </span>
        </button>

        <button 
          class="action-btn like-btn" 
          :class="{ 'is-disabled': blacklistIds.includes(meme.id) }" 
          :disabled="blacklistIds.includes(meme.id)"
          @click="toggleLike(meme.id)"
        >
          <span class="icon-box">
            {{ likedIds.includes(meme.id) ? '❤️' : '🤍' }}
          </span>
        </button>
        <button 
          class="action-btn not-interested-btn" 
          :class="{ 
            'is-hidden': blacklistIds.includes(meme.id),
            'is-disabled': likedIds.includes(meme.id) || favoriteIds.includes(meme.id) 
          }"
          :disabled="likedIds.includes(meme.id) || favoriteIds.includes(meme.id)"
          @click="handleNotInterested(meme.id)"
        >
          <span class="icon-wrapper">
          {{ blacklistIds.includes(meme.id) ? '🙈 ' : '🙈 ' }}
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 1. 基础容器：去除硬编码背景，改用变量 */
.detail-container { max-width: 800px; margin: 40px auto; padding: 0 20px; font-family: sans-serif; color: var(--text-main); }

/* 返回按钮：适配黑夜模式 */
.back-btn-inner {
  position: absolute;
  top: 15px;
  left: 15px;
  
  /* 去掉背景和边框，保持简约 */
  background: transparent;
  border: none;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  color: var(--text-secondary);
  font-size: 20px;
  font-weight: bold;
  padding: 8px;
  transition: all 0.2s;
}

.back-btn-inner:active {
  transform: scale(0.9); /* 点击时的Q弹反馈 */
  opacity: 0.7;
}
/* 核心卡片：背景跟随变量 */
.card { 
  position: relative; /* 必须加这一行 */
  padding-top:30px;  /* 顶部留出空间，防止返回按钮离头像太近 */
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
  padding: 6px 10px; border-radius: 18px; font-size: 12px; 
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
  /* 1. 强制设定为正方形或固定宽度的长方形 */
  width: 60px; 
  height: 60px;
  
  /* 2. 彻底锁死盒模型，防止任何 padding 撑开 */
  box-sizing: border-box;
  padding: 0 !important;
  margin: 0;
  
  /* 3. 居中对齐 */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  
  /* 4. 消除所有背景和边框 */
  background: transparent !important;
  border: none !important;
  outline: none !important;
  
  /* 5. 解决点击时的缩放位移 */
  transform-origin: center;
  transition: transform 0.1s;
}

/* 核心：图标容器 */
.icon-wrapper {
  display: inline-block;
  width: 50px;  /* 固定宽度 */
  height: 50px; /* 固定高度 */
  line-height: 50px;
  text-align: center;
  font-size: 24px; /* 统一图标大小 */
}

/* 针对你怀疑的罪魁祸首进行微调 */
.action-btn:active {
  /* 如果还要缩放，保持极小幅度，或者干脆改成透明度变化 */
  transform: scale(0.96); 
  opacity: 0.8;
}
/* 5. 各按钮配色（使用 RGBA 确保在黑夜模式下也有质感） */
.fav-btn {  color: #4a90e2; }
.like-btn {  color: #ff8f00; }
.fav-btn.active, .like-btn.liked-active {
  background-color: transparent !important;
  border: none !important;
}

.icon-box {
  display: inline-block;
  /* 1. 调整这里：这是图标的大小（原本是 20px） */
  font-size: 28px;  
  
  /* 2. 这里的宽高要比 font-size 大一点点，确保图标有活动空间 */
  width: 32px;      
  height: 32px;
  line-height: 32px; /* 保持行高和高度一致，图标才会垂直居中 */
  
  text-align: center;
  transition: all 0.2s;
}
/* 没意思按钮的初始样式 */
.not-interested-btn {
  background-color:transparent !important;
  color: #888;
  transition: all 0.2s;
  padding: 0 !important;
  border: none !important;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* 💡 点击后变成“撤销隐藏”的样式 */
.not-interested-btn.is-hidden {
  background-color: transparent !important; 
  color: var(--text-secondary) !important;
  opacity: 0.5;
  text-decoration: line-through; /* 增加删除线视觉效果 */
}

.not-interested-btn .icon-wrapper {
  /* 这里的数值要和你给点赞收藏设置的一模一样 */
  font-size: 28px; 
  line-height: 32px; 
  width: 32px;
  height: 32px;
  display: inline-block;
  text-align: center;
}
/* 悬浮时的反馈 */
.not-interested-btn:hover {
  filter: brightness(0.9);
}
.is-disabled {
  opacity: 0.3;      /* 变透明，表示无法点击 */
  cursor: not-allowed;
  filter: grayscale(1); /* 变成灰色 */
  pointer-events: none;
}
</style>

