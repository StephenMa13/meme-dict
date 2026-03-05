<script setup>
import { ref, computed, onMounted } from 'vue'
import { getMemes } from '../db.js' 
import { useRouter } from 'vue-router'
import { categoryConfig } from '../categories.js'

const router = useRouter()
const allMemes = ref([])

onMounted(() => {
  allMemes.value = getMemes() || []
})

// 1. 核心逻辑：计算分类数据并生成随机预览，包含尺寸预计算
const bubbleCategories = computed(() => {
  if (!allMemes.value || allMemes.value.length === 0) return []

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
          allTerms: []
        }
      }
      categoryMap[cat].totalViews += (meme.view_count || 0)
      categoryMap[cat].count += 1
      categoryMap[cat].allTerms.push(meme.term) 
    })
  })

  // 提取极值用于计算缩放
  const counts = Object.values(categoryMap).map(c => c.count)
  const maxCount = counts.length ? Math.max(...counts) : 1
  const minCount = counts.length ? Math.min(...counts) : 0

  // 🌟 缩小 1/3 的尺寸界限 (原：90~200，现：60~134)
  const minSize = 60  
  const maxSize = 134 

  // 第二步：转为数组，先计算每个泡泡的大小，再决定放几个词
  const categoriesArray = Object.values(categoryMap).map(item => {
    let size = (minSize + maxSize) / 2
    if (maxCount !== minCount) {
      const ratio = (item.count - minCount) / (maxCount - minCount)
      size = minSize + Math.pow(ratio, 1.2) * (maxSize - minSize)
    }

    // 🌟 动态判断：根据算出来的物理尺寸决定展示的词条数量
    let maxTerms = 3
    if (size < 85) {
      maxTerms = 1 // 太小的气泡只放1个词
    } else if (size < 110) {
      maxTerms = 2 // 中等的气泡放2个词
    }

    // 随机洗牌该分类下的词条
    const shuffledTerms = [...item.allTerms].sort(() => 0.5 - Math.random())
    
    return {
      name: item.name,
      count: item.count,
      totalViews: item.totalViews,
      size: size, // 把计算好的物理尺寸保存下来
      previewTerms: shuffledTerms.slice(0, maxTerms) 
    }
  })

  // 第三步：打乱整个分类数组的顺序以产生随机错落感
  return categoriesArray.sort(() => 0.5 - Math.random())
})


// 2. 动态样式计算：直接使用已经在 computed 里算好的 size
const getBubbleStyle = (size, index) => {
  const offsetY = index % 2 === 0 ? '12px' : '-12px';
  const offsetX = index % 3 === 0 ? '8px' : '-8px';

  return {
    width: `${size}px`,
    height: `${size}px`,
    transform: `translate(${offsetX}, ${offsetY})`,
    // 字体基准随气泡尺寸按比例缩小，最小11px
    fontSize: `${Math.max(11, size / 11)}px`,
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
      <!-- 🌟 注意这里传入的是 cat.size -->
      <div 
        v-for="(cat, index) in bubbleCategories" 
        :key="cat.name" 
        class="bubble-item"
        :style="getBubbleStyle(cat.size, index)" 
        @click="goToCategory(cat.name)" 
      >
        <div class="bubble-inner">
          <span class="cat-icon">{{ categoryConfig[cat.name]?.icon || '✨' }}</span>
          <strong class="cat-name">{{ cat.name }}</strong>
          
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
  flex-direction: column;
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
  gap: 20px; /* 间距稍微调小一点，配合缩小的气泡 */
  max-width: 1200px;
  padding: 20px;
}

/* 3. 气泡个体 */
.bubble-item {
  border-radius: 50%;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  
  box-shadow: 
    0 10px 25px rgba(0,0,0,0.06), 
    inset -4px -4px 12px rgba(0,0,0,0.03),
    inset 4px 4px 12px rgba(255,255,255,0.7);

  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0; 
  
  transition: 
    transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), 
    box-shadow 0.3s ease,
    border-color 0.3s ease;
  animation: float 5s ease-in-out infinite;
  
  overflow: hidden;
  text-align: center;
  /* 🌟 Padding 必须缩小，否则文字会被挤出边界 */
  padding: 8px; 
}

.bubble-item:nth-child(even) { animation-delay: 1s; animation-duration: 6s; }
.bubble-item:nth-child(3n) { animation-delay: 2s; animation-duration: 4.5s; }

.bubble-item:hover {
  transform: scale(1.1) translateY(-10px) !important;
  z-index: 10;
  box-shadow: 0 15px 35px rgba(0,0,0,0.12);
  border-color: #FFD700;
  animation-play-state: paused; 
}

/* 4. 气泡内部内容布局 */
.bubble-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px; /* 内部间隙变紧凑 */
  width: 100%;
}

.cat-icon { 
  font-size: 1.2em; /* 随气泡缩小 */
  margin-bottom: -2px;
}

.cat-name { 
  font-size: 1em; /* 随气泡缩小 */
  color: var(--text-main); 
  font-weight: 800; 
  white-space: nowrap;
  text-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

/* 5. 词条云预览 */
.preview-tag {
  font-size: 0.6em; /* 字体缩小防溢出 */
  padding: 1px 4px;       
  margin: 1px;            
  background: var(--bg-color);
  color: var(--text-secondary);
  border-radius: 6px;
  white-space: nowrap;
  opacity: 0.9;
  
  /* 🌟 防溢出兜底：就算词条超级长，也绝对截断加省略号，不撑破气泡 */
  max-width: 90%;
  overflow: hidden;
  text-overflow: ellipsis;
}

.preview-cloud {
  display: flex;
  flex-wrap: wrap;        
  justify-content: center;
  align-items: center;
  gap: 1px;               
  max-width: 98%;         
}

/* 6. 动画与适配 */
@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
}

:global(html.dark-mode) .bubble-item {
  box-shadow: 
    0 10px 30px rgba(0,0,0,0.4), 
    inset -2px -2px 8px rgba(0,0,0,0.3),
    inset 2px 2px 8px rgba(255,255,255,0.05);
}

@media (max-width: 768px) {
  .bubbles-wrapper { gap: 10px; }
  .page-header h2 { font-size: 22px; }
  .bubble-item { animation-duration: 7s; }
}
</style>
