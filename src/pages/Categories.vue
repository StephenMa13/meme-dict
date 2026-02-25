<script setup>
import { ref, computed, onMounted } from 'vue'
import { getMemes } from '../db.js' // 假设你的数据获取函数在这里
import { useRouter } from 'vue-router'
const router = useRouter()
const allMemes = ref([])

onMounted(() => {
  allMemes.value = getMemes()
})

// 点击气泡跳转到详情页，并把分类名字传过去
const goToCategory = (name) => {
  router.push(`/category/${name}`)
}

// 💡 核心逻辑：计算并排序分类气泡
const bubbleCategories = computed(() => {
  const categoryMap = {}

  allMemes.value.forEach(meme => {
    // 兼容处理：如果没有分类则归为"其他"，如果是数组则遍历，如果是字符串则直接用
    let cats = meme.category || '其他'
    if (!Array.isArray(cats)) cats = [cats]

    cats.forEach(cat => {
      if (!categoryMap[cat]) {
        categoryMap[cat] = { name: cat, totalViews: 0, count: 0 }
      }
      // 累加浏览量
      categoryMap[cat].totalViews += (meme.view_count || 0)
      // 记录该分类下有多少个词条
      categoryMap[cat].count += 1
    })
  })

  // 把对象转成数组，并根据 totalViews 降序排序
  return Object.values(categoryMap).sort((a, b) => b.totalViews - a.totalViews)
})

// 根据排名动态调整气泡的大小（前三名气泡更大）
const getBubbleClass = (index) => {
  if (index === 0) return 'bubble-xl'
  if (index === 1 || index === 2) return 'bubble-lg'
  return 'bubble-md'
}
</script>

<template>
  <div class="categories-container">
    <header class="page-header">
      <h2>🫧 热梗星系</h2>
      <p class="subtitle">全网分类热度排行榜，气泡越大越火爆</p>
    </header>

    <div class="bubbles-wrapper">
      <div 
        v-for="(cat, index) in bubbleCategories" 
        :key="cat.name" 
        class="bubble"
        :class="getBubbleClass(index)"
        @click="goToCategory(cat.name)" 
      >
      <div class="bubble-content">
          <span class="cat-name">{{ cat.name }}</span>
          <span class="cat-hot">🔥 {{ cat.totalViews }}</span>
          <span class="cat-count">{{ cat.count }} 个词条</span>
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

/* 气泡容器：使用 Flex 布局让气泡自然错落排布 */
.bubbles-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  justify-content: center;
  align-items: center;
  padding: 20px 0;
}

/* 🫧 气泡基础质感 */
.bubble {
  border-radius: 50%; /* 变成正圆 */
  background: var(--card-bg);
  /* 魔法：外阴影模拟浮力，内阴影模拟玻璃/气泡的高光反光 */
  box-shadow: 
    0 10px 20px rgba(0,0,0,0.08), 
    inset -4px -4px 10px rgba(0,0,0,0.02),
    inset 4px 4px 10px rgba(255,255,255,0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  border: 1px solid var(--border-color);
  /* 呼吸浮动动画 */
  animation: float 4s ease-in-out infinite;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

/* 为了让不同气泡浮动频率不同，利用 CSS 伪类加延迟 */
.bubble:nth-child(even) { animation-delay: 1s; animation-duration: 5s; }
.bubble:nth-child(3n) { animation-delay: 2s; animation-duration: 4.5s; }

.bubble:hover {
  transform: scale(1.1) translateY(-10px);
  box-shadow: 
    0 15px 25px rgba(0,0,0,0.15), 
    inset -4px -4px 10px rgba(0,0,0,0.02),
    inset 4px 4px 10px rgba(255,255,255,0.8);
}

/* 夜间模式的气泡质感微调，降低高光，加深阴影 */
:global(html.dark-mode) .bubble {
  box-shadow: 
    0 10px 20px rgba(0,0,0,0.3), 
    inset -4px -4px 10px rgba(0,0,0,0.2),
    inset 4px 4px 10px rgba(255,255,255,0.05);
}

/* 不同体型的气泡 */
.bubble-xl { width: 160px; height: 160px; }
.bubble-lg { width: 130px; height: 130px; }
.bubble-md { width: 100px; height: 100px; }

.bubble-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 4px;
}

.cat-name {
  font-weight: 900;
  color: var(--text-main);
  /* 动态大小：利用父元素的相对单位 */
}
.bubble-xl .cat-name { font-size: 22px; }
.bubble-lg .cat-name { font-size: 18px; }
.bubble-md .cat-name { font-size: 15px; }

.cat-hot {
  font-size: 13px;
  font-weight: bold;
  color: #ff4757;
}

.cat-count {
  font-size: 11px;
  color: var(--text-secondary);
}

@keyframes float {
  0% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
  100% { transform: translateY(0); }
}
</style>