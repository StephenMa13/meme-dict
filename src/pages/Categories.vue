<script setup>
import { ref, computed, onMounted } from 'vue'
import { getMemes } from '../db.js' 
import { useRouter } from 'vue-router'
import { categoryConfig } from '../categories.js'
const router = useRouter()
const allMemes = ref([])

onMounted(() => {
  allMemes.value = getMemes()
})



// 1. 核心逻辑：计算分类数据并生成随机预览
const bubbleCategories = computed(() => {
  const categoryMap = {}

  // 第一步：聚合并收集该分类下的所有词条名
  allMemes.value.forEach(meme => {
    let cats = meme.category || '其他'
    if (!Array.isArray(cats)) cats = [cats]

    cats.forEach(cat => {
      if (!categoryMap[cat]) {
        categoryMap[cat] = { 
          name: cat, 
          totalViews: 0, 
          count: 0,
          allTerms: [] // 新增：存入该分类下所有的梗名称
        }
      }
      categoryMap[cat].totalViews += (meme.view_count || 0)
      categoryMap[cat].count += 1
      categoryMap[cat].allTerms.push(meme.term) 
    })
  })

  // 第二步：将 Map 转为数组，并为每个分类抽取随机预览词
  const categoriesArray = Object.values(categoryMap).map(item => {
    // 随机洗牌该分类下的词条，取前 3 个
    const shuffledTerms = [...item.allTerms].sort(() => 0.5 - Math.random())
    
    return {
      name: item.name,
      count: item.count,
      totalViews: item.totalViews,
      // 这里的 previewTerms 就是我们要显示在气泡里的词
      previewTerms: shuffledTerms.slice(0, 3) 
    }
  })

  // 第三步：🌟 关键！打乱整个分类数组的顺序
  // 这样在 DOM 渲染时，大泡泡（数量多）和小泡泡（数量少）就会随机挨在一起
  return categoriesArray.sort(() => 0.5 - Math.random())
})


// 2. 动态样式计算：根据 count 映射直径尺寸
const getBubbleStyle = (count, index) => {
  const counts = bubbleCategories.value.map(c => c.count)
  const maxCount = Math.max(...counts)
  const minCount = Math.min(...counts)

  const minSize = 90  // 稍微大一点，否则放不下文字
  const maxSize = 200 

  let size = (minSize + maxSize) / 2

  if (maxCount !== minCount) {
    // 使用 Math.pow 让大小差距更明显（大者更大，小者更小）
    const ratio = (count - minCount) / (maxCount - minCount)
    size = minSize + Math.pow(ratio, 1.2) * (maxSize - minSize)
  }

  // 💡 错落感核心：根据 index 奇偶性产生上下位移偏移
  const offsetY = index % 2 === 0 ? '12px' : '-12px';
  const offsetX = index % 3 === 0 ? '8px' : '-8px';

  return {
    width: `${size}px`,
    height: `${size}px`,
    // 这里的 transform 让球体不再死板地排列在水平线上
    transform: `translate(${offsetX}, ${offsetY})`,
    fontSize: `${Math.max(13, size / 10)}px`,
    transition: 'all 0.4s ease-out'
  }
}

const goToCategory = (name) => {
  router.push(`/category/${name}`)
}
</script>

<template>
  <div class="categories-page">
    <div class="bubbles-wrapper">
      <!-- 💡 传入 index 用于计算位置偏移，实现“大中有小、错落有致” -->
      <div 
        v-for="(cat, index) in bubbleCategories" 
        :key="cat.name" 
        class="bubble-item"
        :style="getBubbleStyle(cat.count, index)" 
        @click="goToCategory(cat.name)" 
      >
        <div class="bubble-inner">
          <span class="cat-icon">{{ categoryConfig[cat.name]?.icon || '✨' }}</span>
          <strong class="cat-name">{{ cat.name }}</strong>
          
          <!-- 🌟 替换原来的数字：展示该分类下随机的几个词 -->
          <div class="preview-cloud">
            <span v-for="term in cat.previewTerms" :key="term" class="preview-tag">
              {{ term }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


<style scoped>
/* 1. 页面整体布局 */
.categories-page {
  padding: 60px 20px;
  min-height: 80vh;
  display: flex;
  flex-direction: column; /* 纵向排列 Header 和 Bubbles */
  align-items: center;
}

.page-header {
  text-align: center;
  margin-bottom: 40px;
}

.page-header h2 {
  margin: 0;
  color: var(--text-main);
  font-size: 28px;
  font-weight: 800;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 15px;
  margin-top: 10px;
  opacity: 0.8;
}

/* 2. 气泡容器 */
.bubbles-wrapper {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 30px; /* 增大间距，让呼吸感更强 */
  max-width: 1200px;
  padding: 20px;
}

/* 3. 气泡个体 - 融合了拟物阴影与漂浮动效 */
.bubble-item {
  border-radius: 50%;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  
  /* 拟物化阴影：外阴影 + 内高光 */
  box-shadow: 
    0 10px 25px rgba(0,0,0,0.06), 
    inset -4px -4px 12px rgba(0,0,0,0.03),
    inset 4px 4px 12px rgba(255,255,255,0.7);

  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0; /* 强制保持圆形 */
  
  /* 动画结合：过渡 + 循环漂浮 */
  transition: 
    transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), 
    box-shadow 0.3s ease,
    border-color 0.3s ease;
  animation: float 5s ease-in-out infinite;
  
  overflow: hidden;
  text-align: center;
  padding: 15px;
}

/* 利用 nth-child 实现交错的漂浮效果 */
.bubble-item:nth-child(even) { animation-delay: 1s; animation-duration: 6s; }
.bubble-item:nth-child(3n) { animation-delay: 2s; animation-duration: 4.5s; }

.bubble-item:hover {
  /* 悬停时稍微放大并停止位移感 */
  transform: scale(1.1) translateY(-10px) !important;
  z-index: 10;
  box-shadow: 0 15px 35px rgba(0,0,0,0.12);
  border-color: #FFD700;
  animation-play-state: paused; /* 悬停时静止以便阅读词条 */
}

/* 4. 气泡内部内容布局 */
.bubble-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
}

.cat-icon { 
  font-size: 1.5em; 
  margin-bottom: -4px;
}

.cat-name { 
  font-size: 1.15em; 
  color: var(--text-main); 
  font-weight: 800; 
  white-space: nowrap;
  text-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

/* 5. 词条云预览 (取代了数字) */
/* 修改这一处，让标签更紧凑 */
.preview-tag {
  font-size: 0.65em;      /* 稍微调小字号 */
  padding: 1px 6px;       /* 缩小内边距 */
  margin: 1px;            /* 增加间距防止重叠 */
  background: var(--bg-color);
  color: var(--text-secondary);
  border-radius: 8px;
  white-space: nowrap;
  opacity: 0.9;
}

/* 确保容器能换行排布 */
.preview-cloud {
  display: flex;
  flex-wrap: wrap;        /* 必须允许换行 */
  justify-content: center;
  align-items: center;
  gap: 2px;               /* 词与词之间的间距 */
  max-width: 95%;         /* 占用气泡更宽的面积 */
}


/* 6. 动画与适配 */
@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-15px); }
  100% { transform: translateY(0px); }
}

/* 夜间模式特定阴影调整 */
:global(html.dark-mode) .bubble-item {
  box-shadow: 
    0 10px 30px rgba(0,0,0,0.4), 
    inset -2px -2px 8px rgba(0,0,0,0.3),
    inset 2px 2px 8px rgba(255,255,255,0.05);
}

/* 移动端适配 */
@media (max-width: 768px) {
  .bubbles-wrapper { gap: 15px; }
  .page-header h2 { font-size: 22px; }
  
  .bubble-item { 
    /* 移动端减小动画幅度 */
    animation-duration: 7s;
  }
  
  .preview-tag {
  }
  .preview-tag:first-child {
  }
}

</style>
