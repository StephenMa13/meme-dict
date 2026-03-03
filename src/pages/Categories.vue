<script setup>
import { ref, computed, onMounted } from 'vue'
import { getMemes } from '../db.js' 
import { useRouter } from 'vue-router'

const router = useRouter()
const allMemes = ref([])

onMounted(() => {
  allMemes.value = getMemes()
})

const goToCategory = (name) => {
  router.push(`/category/${name}`)
}

// 1. 核心逻辑：计算分类数据
const bubbleCategories = computed(() => {
  const categoryMap = {}

  allMemes.value.forEach(meme => {
    let cats = meme.category || '其他'
    if (!Array.isArray(cats)) cats = [cats]

    cats.forEach(cat => {
      if (!categoryMap[cat]) {
        categoryMap[cat] = { name: cat, totalViews: 0, count: 0 }
      }
      categoryMap[cat].totalViews += (meme.view_count || 0)
      categoryMap[cat].count += 1
    })
  })

  // 依然按热度排序，但大小将由 count 决定
  return Object.values(categoryMap).sort((a, b) => b.totalViews - a.totalViews)
})

// 2. 动态样式计算：根据 count 映射直径尺寸
const getBubbleStyle = (count) => {
  const counts = bubbleCategories.value.map(c => c.count)
  const maxCount = Math.max(...counts)
  const minCount = Math.min(...counts)

  // 设定气泡尺寸范围 (单位: px)
  const minSize = 80
  const maxSize = 200

  let size = (minSize + maxSize) / 2 // 只有一个分类时的默认值

  if (maxCount !== minCount) {
    // 线性映射公式：
    // $$size = minSize + \frac{count - minCount}{maxCount - minCount} \times (maxSize - minSize)$$
    const ratio = (count - minCount) / (maxCount - minCount)
    size = minSize + ratio * (maxSize - minSize)
  }

  return {
    width: `${size}px`,
    height: `${size}px`,
    // 文字大小也随气泡按比例微调
    fontSize: `${Math.max(12, size / 8)}px`
  }
}
</script>

<template>
  <div class="categories-container">
    <header class="page-header">
      <h2>🫧 热梗星系</h2>
      <p class="subtitle">气泡越大代表收录词条越多，🔥代表全网热度</p>
    </header>

    <div class="bubbles-wrapper">
      <div 
        v-for="cat in bubbleCategories" 
        :key="cat.name" 
        class="bubble"
        :style="getBubbleStyle(cat.count)" 
        @click="goToCategory(cat.name)" 
      >
        <div class="bubble-content">
          <span class="cat-name">{{ cat.name }}</span>
          <span class="cat-hot">🔥 {{ cat.totalViews }}</span>
          <span class="cat-count">{{ cat.count }} 词条</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.categories-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  margin-bottom: 30px;
}

.page-header h2 {
  margin: 0;
  color: var(--text-main);
  font-size: 24px;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 14px;
  margin-top: 8px;
}

.bubbles-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 25px;
  justify-content: center;
  align-items: center;
  padding: 20px 0;
}

.bubble {
  border-radius: 50%; 
  background: var(--card-bg);
  box-shadow: 
    0 10px 20px rgba(0,0,0,0.08), 
    inset -4px -4px 10px rgba(0,0,0,0.02),
    inset 4px 4px 10px rgba(255,255,255,0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  border: 1px solid var(--border-color);
  animation: float 4s ease-in-out infinite;
  transition: scale 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s;
  /* 确保圆形不受内容挤压 */
  flex-shrink: 0; 
}

.bubble:nth-child(even) { animation-delay: 1s; animation-duration: 5s; }
.bubble:nth-child(3n) { animation-delay: 2s; animation-duration: 4.5s; }

.bubble:hover {
  scale: 1.08; 
  box-shadow: 0 15px 25px rgba(0,0,0,0.15);
  z-index: 10;
}

.bubble-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 10px;
  width: 90%; /* 保证文字不超出圆形边缘 */
  overflow: hidden;
}

.cat-name {
  font-weight: 900;
  color: var(--text-main);
  margin-bottom: 2px;
  /* 避免长文本换行 */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

.cat-hot {
  font-size: 0.8em;
  font-weight: bold;
  color: #ff4757;
}

.cat-count {
  font-size: 0.7em;
  color: var(--text-secondary);
  opacity: 0.8;
}

@keyframes float {
  0% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0); }
}

/* 夜间模式调整 */
:global(html.dark-mode) .bubble {
  box-shadow: 
    0 10px 20px rgba(0,0,0,0.4), 
    inset -2px -2px 6px rgba(0,0,0,0.3),
    inset 2px 2px 6px rgba(255,255,255,0.05);
}
</style>
